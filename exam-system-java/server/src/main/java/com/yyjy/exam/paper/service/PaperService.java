package com.yyjy.exam.paper.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.dto.PaperListQuery;
import com.yyjy.exam.entity.paper.dto.PaperSaveInput;
import com.yyjy.exam.entity.paper.entity.*;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionAddReq;
import com.yyjy.exam.entity.paper.io.req.PaperUpdateInput;
import com.yyjy.exam.paper.repository.PaperCategoriesRepository;
import com.yyjy.exam.paper.repository.PaperQuestionRepository;
import com.yyjy.exam.paper.repository.PaperRepository;
import com.yyjy.exam.question.repository.QuestionsRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaperService {
	
	/**
	 * 新建试卷时参与方式与次数上限的默认值（与 `paper` 两列的库默认值保持一致）。
	 */
	private static final ParticipateMode DEFAULT_PARTICIPATE_MODE = ParticipateMode.LOGIN_REQUIRED;
	private static final int DEFAULT_MAX_ATTEMPTS = 1;
	private final PaperRepository paperRepository;
	private final PaperQuestionRepository paperQuestionRepo;
	private final PaperCategoriesRepository paperCategoriesRepository;
	private final QuestionsRepository questionsRepository;
	
	/**
	 * 多用户改造：试卷归属校验的统一出口（决策台账 Q5 / Q25）。
	 * 纯 owner 相等判断，**没有身份分支** —— 不给 admin 开后门。
	 * 走 Table.userId() 而不是 paper.userId()：实体按决定只加了 user()，没加 @IdView。
	 */
	/**
	 * 试卷发布后题目即冻结：不能再增题、改分值、删题、换整套题目集。
	 * （试卷本身仍可删除 —— 见 removePaper。）
	 */
	public void requireQuestionEditable(int paperId) {
		Paper paper = paperRepository.findById(paperId)
				              .orElseThrow(() -> new BusinessException(MessageConstant.PAPER_NOT_FOUND));
		if (paper.published()) {
			throw new BusinessException(MessageConstant.PAPER_PUBLISHED_CANNOT_EDIT_QUESTIONS);
		}
	}
	
	/**
	 * 提交的题目集（questionId → 分值）与库里现存的是否完全一致。
	 * 用于「已发布试卷只允许改元数据、不允许动题目」的判定。
	 */
	private boolean sameQuestionSet(int paperId, Map<String, Integer> submitted) {
		Map<Long, Integer> stored = paperQuestionRepo.findScoreMapByPaperId(paperId);
		if (stored.size() != submitted.size()) {
			return false;
		}
		for (Map.Entry<String, Integer> entry : submitted.entrySet()) {
			Integer storedScore = stored.get(Long.parseLong(entry.getKey()));
			if (storedScore == null || !storedScore.equals(entry.getValue())) {
				return false;
			}
		}
		return true;
	}
	
	public void requireOwnedPaper(int id) {
		long me = StpUtil.getLoginIdAsLong();
		PaperTable t = PaperTable.$;
		List<Long> owners = paperRepository.sql().createQuery(t)
				                    .where(t.id().eq(id))
				                    .select(t.userId())
				                    .execute();
		if (owners.isEmpty()) {
			throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
		}
		if (owners.getFirst() != me) {
			throw new BusinessException(MessageConstant.NOT_YOUR_RESOURCE);
		}
	}
	
	/**
	 * 一批题目是否都属于当前用户。
	 * 不校验的话，用户 A 可以把自己的试卷里塞进用户 B 的题，
	 * 再通过 GET /paper/{id}（返回 PaperDetail，含选项 correct 与答案）把 B 的题连答案读走。
	 */
	private void requireOwnedQuestions(long userId, List<Long> questionIds) {
		if (!questionsRepository.allOwnedBy(userId, questionIds)) {
			throw new BusinessException(MessageConstant.NOT_YOUR_RESOURCE);
		}
	}
	
	/**
	 * 试卷分类也必须是自己建的，否则能把卷子挂到别人的分类下（null 也一并拦掉）。
	 */
	private void requireOwnedPaperCategory(long userId, Long categoryId) {
		if (categoryId == null || !paperCategoriesRepository.ownedBy(categoryId, userId)) {
			throw new BusinessException(MessageConstant.PAPER_CATEGORY_NOT_EXIST);
		}
	}
	
	/**
	 * 考试时间窗（`paper.start` / `paper.end` 都是 NOT NULL 且无默认值，也没有任何 DB 默认值）。
	 * 正常路径上 `PaperSaveInput` 的 start/end 是 `@FixedInputField`，缺字段会被框架先拦下；
	 * 这里做的是**语义**校验（结束不得早于开始），同时对 null 留一道兜底。
	 */
	private void requireTimeWindow(LocalDateTime start, LocalDateTime end) {
		if (start == null || end == null) {
			throw new BusinessException(MessageConstant.PAPER_TIME_WINDOW_REQUIRED);
		}
		if (end.isBefore(start)) {
			throw new BusinessException(MessageConstant.PAPER_TIME_WINDOW_INVALID);
		}
	}
	
	/**
	 * 次数上限必须 >= 1（列是 `int unsigned NOT NULL DEFAULT 1`）。
	 */
	private void requireValidMaxAttempts(int maxAttempts) {
		if (maxAttempts < 1) {
			throw new BusinessException(MessageConstant.PAPER_MAX_ATTEMPTS_INVALID);
		}
	}
	
	/**
	 * 「我的试卷」列表：强制按 `user_id` 过滤（含未发布草稿）。公开广场走 listPublishedPapers。
	 */
	public List<Paper> listPapersByNameAndStatus(PaperListQuery conditions, Fetcher<Paper> fetcher) {
		PaperTable paper = PaperTable.$;
		
		int page = Objects.requireNonNullElse(conditions.getPage(), 1);
		int size = Objects.requireNonNullElse(conditions.getSize(), 10);
		
		var query = paperRepository.sql().createQuery(paper)
				            .where(paper.userId().eq(StpUtil.getLoginIdAsLong()));
		
		if (Boolean.TRUE.equals(conditions.getOngoing())) {
			query.where(paper.end().ge(LocalDateTime.now()));
			
		} else if (Boolean.FALSE.equals(conditions.getOngoing())) {
			query.where(paper.end().lt(LocalDateTime.now()));
		}
		
		return query
				       .select(paper.fetch(fetcher))
				       .limit(size, (long) (page - 1) * size)
				       .execute();
	}
	
	public PaperDetail getPaper(int id) {
		// 多用户改造：PaperDetail 含选项 correct 与答案，只有作者本人能读
		requireOwnedPaper(id);
		
		PaperDetail result = paperRepository.findDetailById(id);
		if (result == null) {
			throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
		}
		
		List<PaperDetail.TargetOf_questions> sorted =
				result.getQuestions();
		
		result.setQuestions(sorted);
		return result;
	}
	
	@Transactional
	public void updatePaper(PaperUpdateInput paperInput) {
		long me = StpUtil.getLoginIdAsLong();
		
		// 多用户改造：① 试卷必须是自己的；② 目标分类与题目也必须是自己的
		requireOwnedPaper(paperInput.id());
		requireOwnedPaperCategory(me, paperInput.categoryId());
		requireOwnedQuestions(me, paperInput.questions().keySet().stream().map(Long::parseLong).toList());
		
		// 已发布 → 题目集冻结：只允许改元数据（时间窗 / 参与方式 / 次数 / 名称…），
		// 提交的题目集与库里不一致就直接拒绝
		Paper current = paperRepository.findById(paperInput.id())
				                .orElseThrow(() -> new BusinessException(MessageConstant.PAPER_NOT_FOUND));
		if (current.published() && !sameQuestionSet(paperInput.id(), paperInput.questions())) {
			throw new BusinessException(MessageConstant.PAPER_PUBLISHED_CANNOT_EDIT_QUESTIONS);
		}
		
		// 时间窗 / 参与方式 / 次数上限：本接口是全量更新，三项都必须给
		// （已发布的试卷也允许改 —— 项目没有下架接口，改错了还得能自救）
		requireTimeWindow(paperInput.start(), paperInput.end());
		if (paperInput.participateMode() == null) {
			throw new BusinessException(MessageConstant.PAPER_PARTICIPATE_MODE_REQUIRED);
		}
		if (paperInput.maxAttempts() == null) {
			throw new BusinessException(MessageConstant.PAPER_MAX_ATTEMPTS_INVALID);
		}
		requireValidMaxAttempts(paperInput.maxAttempts());
		
		if (paperRepository.existsByUserIdAndNameAndIdNot(me, paperInput.name(), paperInput.id())) {
			throw new BusinessException(MessageConstant.PAPER_NAME_EXIST);
		}
		
		paperQuestionRepo.deleteByPaperId(paperInput.id());
		
		paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setId(paperInput.id());
			draft.setName(paperInput.name());
			draft.setDescription(paperInput.description());
			draft.setDuration(paperInput.duration());
			draft.setCategoryId(paperInput.categoryId());
			draft.setStart(paperInput.start());
			draft.setEnd(paperInput.end());
			draft.setParticipateMode(paperInput.participateMode());
			draft.setMaxAttempts(paperInput.maxAttempts());
			for (Map.Entry<String, Integer> entry : paperInput.questions().entrySet()) {
				long questionId = Long.parseLong(entry.getKey());
				int score = entry.getValue();
				draft.addIntoPaperQuestions(pq -> {
					pq.setQuestionId(questionId);
					pq.setScore(score);
				});
			}
		}), SaveMode.UPDATE_ONLY, AssociatedSaveMode.APPEND);
	}
	
	@Transactional
	public void removePaper(int id) {
		// 多用户改造：只能删自己的卷
		// 试卷本身允许删除（即使已发布、即使已被考试引用）—— 题目才受发布态冻结，
		// 见 requireQuestionEditable。注意：删掉已被考过的卷会让历史考试记录的 paper 悬空。
		requireOwnedPaper(id);
		
		paperRepository.deleteById(id);
	}
	
	public List<PaperDetail.TargetOf_questions> getPaperQuestions(int id) {
		// 多用户改造：只能看自己卷子里的题（返回值含选项 correct 与答案）
		requireOwnedPaper(id);
		
		PaperDetail detail = paperRepository.findDetailById(id);
		if (detail == null) throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
		return detail.getQuestions();
	}
	
	@Transactional
	public int addPaper(PaperSaveInput input) {
		long userId = StpUtil.getLoginIdAsLong();
		
		// 多用户改造：① 判重按用户；② 分类必须是自己的；③ 考试时间窗必填
		if (paperRepository.existsByUserIdAndName(userId, input.getName())) {
			throw new BusinessException(MessageConstant.PAPER_NAME_EXIST);
		}
		requireOwnedPaperCategory(userId, input.getCategoryId());
		requireTimeWindow(input.getStart(), input.getEnd());
		
		// 参与方式与次数上限在 DTO 里是**可选**的（不传就用默认值），这样前端不传也不会把建卷打死
		input.getParticipateMode();
		ParticipateMode participateMode = input.getParticipateMode();
		int maxAttempts = input.getMaxAttempts();
		requireValidMaxAttempts(maxAttempts);
		
		Paper paper = paperRepository.save(PaperDraft.$.produce(input.toEntity(), draft -> {
			draft.setUserId(userId);
			draft.setParticipateMode(participateMode);
			draft.setMaxAttempts(maxAttempts);
			draft.setPublished(false);
			draft.setQuestionCount(0);
			draft.setTotalScore(0);
		}), SaveMode.INSERT_ONLY);
		return paper.id();
	}
	
	@Transactional
	public void publishPaper(int id) {
		// 多用户改造：只能发布自己的卷
		requireOwnedPaper(id);
		
		Paper paper = paperRepository.findById(id)
				              .orElseThrow(() -> new BusinessException(MessageConstant.PAPER_NOT_FOUND));
		if (paper.published()) {
			throw new BusinessException(MessageConstant.PAPER_IS_PUBLISHED);
		}
		paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setId(id);
			draft.setPublished(true);
		}), SaveMode.UPDATE_ONLY);
	}
	
	@Transactional
	public void addPaperQuestions(int paperId, PaperQuestionAddReq input) {
		long me = StpUtil.getLoginIdAsLong();
		List<PaperQuestionAddReq.Item> items = input.questions() != null ? input.questions() : List.of();
		
		// 多用户改造：试卷与要加进去的题目都必须是自己的
		requireOwnedPaper(paperId);
		// 发布后题目冻结
		requireQuestionEditable(paperId);
		requireOwnedQuestions(me, items.stream().map(PaperQuestionAddReq.Item::questionId).toList());
		
		for (var item : items) {
			var existing = paperQuestionRepo.findByPaperIdAndQuestionId(paperId, item.questionId());
			
			if (existing != null) {
				paperQuestionRepo.save(PaperQuestionDraft.$.produce(draft -> {
					draft.setId(existing.id());
					draft.setScore(item.score());
				}), SaveMode.UPDATE_ONLY);
			} else {
				paperQuestionRepo.save(PaperQuestionDraft.$.produce(draft -> {
					draft.setPaperId(paperId);
					draft.setQuestionId(item.questionId());
					draft.setScore(item.score());
				}), SaveMode.INSERT_ONLY);
			}
		}
		
		paperRepository.recalculateTotals(paperId);
	}
	
	@Transactional
	public void removePaperQuestion(int paperId, long questionId) {
		// 多用户改造：只能改自己的卷
		requireOwnedPaper(paperId);
		// 发布后题目冻结
		requireQuestionEditable(paperId);
		
		paperQuestionRepo.deleteByPaperIdAndQuestionId(paperId, questionId);
		paperRepository.recalculateTotals(paperId);
	}
	
	@Transactional
	public void updatePaperQuestionScore(int paperId, long questionId, int score) {
		// 多用户改造：只能改自己的卷
		requireOwnedPaper(paperId);
		// 发布后题目冻结
		requireQuestionEditable(paperId);
		
		var existing = paperQuestionRepo.findByPaperIdAndQuestionId(paperId, questionId);
		if (existing == null) throw new BusinessException("试卷中不存在该题目");
		
		paperQuestionRepo.save(PaperQuestionDraft.$.produce(draft -> {
			draft.setId(existing.id());
			draft.setScore(score);
		}), SaveMode.UPDATE_ONLY);
		
		paperRepository.recalculateTotals(paperId);
	}
	
	@Transactional
	public Paper aiCreatePaper(PaperAiSaveDto dto) {
		if (dto.getRules() == null || dto.getRules().isEmpty()) {
			throw new BusinessException(MessageConstant.PAPER_RULE_EMPTY);
		}
		
		long me = StpUtil.getLoginIdAsLong();
		
		// 多用户改造：这套接口原来对全体登录用户开放，但既不 set user_id 也不 set start/end，
		// 且选题用全局查询 → 补上 owner / 分类归属 / 时间窗 / 按用户选题
		if (paperRepository.existsByUserIdAndName(me, dto.getName())) {
			throw new BusinessException(MessageConstant.PAPER_NAME_EXIST);
		}
		requireOwnedPaperCategory(me, dto.getCategoryId());
		requireTimeWindow(dto.getStart(), dto.getEnd());
		
		Map<Long, Integer> questionScores = new LinkedHashMap<>();
		int questionCount = 0;
		int totalScore = 0;
		
		for (PaperAiSaveDto.Rule rule : dto.getRules()) {
			if (rule.getCount() <= 0) continue;
			if (rule.getCategoryIds() == null || rule.getCategoryIds().isEmpty()) continue;
			
			List<Long> allIds = questionsRepository.findIdsByTypeAndCategoryIds(
					me, rule.getType(), rule.getCategoryIds());
			
			if (allIds.isEmpty()) continue;
			
			int realCount = Math.min(rule.getCount(), allIds.size());
			Collections.shuffle(allIds);
			
			for (int i = 0; i < realCount; i++) {
				questionScores.put(allIds.get(i), rule.getScore());
			}
			
			questionCount += realCount;
			totalScore += realCount * rule.getScore();
		}
		
		int finalQuestionCount = questionCount;
		int finalTotalScore = totalScore;
		return paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setUserId(me);
			draft.setCategoryId(dto.getCategoryId());
			draft.setName(dto.getName());
			draft.setDescription(dto.getDescription());
			draft.setDuration(dto.getDuration());
			draft.setStart(dto.getStart());
			draft.setEnd(dto.getEnd());
			draft.setPublished(false);
			// 智能组卷路径暂不提供这两个参数的入口，用默认值（与 addPaper 不传时一致）
			draft.setParticipateMode(DEFAULT_PARTICIPATE_MODE);
			draft.setMaxAttempts(DEFAULT_MAX_ATTEMPTS);
			draft.setQuestionCount(finalQuestionCount);
			draft.setTotalScore(finalTotalScore);
			for (Map.Entry<Long, Integer> entry : questionScores.entrySet()) {
				draft.addIntoPaperQuestions(pq -> {
					pq.setQuestionId(entry.getKey());
					pq.setScore(entry.getValue());
				});
			}
		}), SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND);
	}
}
