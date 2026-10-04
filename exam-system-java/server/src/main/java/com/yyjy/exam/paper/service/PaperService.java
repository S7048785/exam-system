package com.yyjy.exam.paper.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.convention.result.PageRes;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.constant.ValidationMessage;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.dto.PaperExamSettingsInput;
import com.yyjy.exam.entity.paper.dto.PaperSaveInput;
import com.yyjy.exam.entity.paper.entity.*;
import com.yyjy.exam.entity.paper.io.req.PaperListQuery;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionAddReq;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionsUpdateReq;
import com.yyjy.exam.paper.repository.PaperCategoriesRepository;
import com.yyjy.exam.paper.repository.PaperExamSettingsRepository;
import com.yyjy.exam.paper.repository.PaperQuestionRepository;
import com.yyjy.exam.paper.repository.PaperRepository;
import com.yyjy.exam.question.repository.QuestionsRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.JoinType;
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
	 * 智能组卷时的参与方式默认值（与 `paper.participate_mode` 的库默认值保持一致）。
	 */
	private static final ParticipateMode DEFAULT_PARTICIPATE_MODE = ParticipateMode.LOGIN_REQUIRED;
	
	private final PaperRepository paperRepository;
	private final PaperQuestionRepository paperQuestionRepo;
	private final PaperCategoriesRepository paperCategoriesRepository;
	private final QuestionsRepository questionsRepository;
	private final PaperExamSettingsRepository paperExamSettingsRepo;
	
	/**
	 * 写入考试设置（1:1 子表 `paper_exam_settings`）：存在则更新、不存在则新增。
	 * <p>
	 * 显式 upsert、不依赖聚合级联：级联在不同 {@link SaveMode} 下行为不同
	 * （INSERT_ONLY 会连带插子表、UPDATE_ONLY 不会），这里统一兜一次，
	 * 保证**有且只有一行设置**。
	 * <p>
	 * 建卷不再预写默认行（发布前必须先配过设置），所以这里只剩「新建」与「更新」两种情况，
	 * 没有「没带字段就写库默认值」的分支。
	 */
	private void saveExamSettings(long paperId, PaperExamSettingsInput settings) {
		PaperExamSettings existing = paperExamSettingsRepo.findByPaperId(paperId);
		
		PaperExamSettings draft = PaperExamSettingsDraft.$.produce(d -> {
			if (existing != null) {
				d.setId(existing.id());
			}
			d.setPaperId(paperId);
			d.setDuration(settings.getDuration());
			d.setStart(settings.getStart());
			d.setEnd(settings.getEnd());
			// 及格分是必填（实体里是 int），DTO 的 getter 也是基本类型，别再判 null
			d.setPassingScore(settings.getPassingScore());
			d.setMaxAttempts(settings.getMaxAttempts());
			// 8 项开关在实体里是 Boolean，生成的 DTO 访问器是 getXxx()（不是 isXxx()）
			d.setRequireAllAnswered(settings.getRequireAllAnswered());
			d.setHideQuestionScore(settings.getHideQuestionScore());
			d.setShowRankAfterSubmit(settings.getShowRankAfterSubmit());
			d.setShowAnswerAfterSubmit(settings.getShowAnswerAfterSubmit());
			d.setMinAnswerMinutes(settings.getMinAnswerMinutes());
			d.setShuffleQuestions(settings.getShuffleQuestions());
			d.setShuffleChoices(settings.getShuffleChoices());
		});
		paperExamSettingsRepo.save(draft, SaveMode.UPSERT);
	}
	
	/**
	 * 题目集校验（整体替换用，见 {@link #replacePaperQuestions}）。
	 * Web 层已有 @NotEmpty / 元素级 @Valid 兜底，这里再守一道，避免绕过校验的调用路径。
	 * <p>
	 * 同一道题在一次请求里**只能出现一次**，重复直接拒（而不是悄悄去重）：
	 * 客户端给出 `[{179,5},{179,7}]` 时到底想表达 5 还是 7，服务端无从判断，
	 * 静默保留一条属于替调用方猜意图；而放它们过去又会被写成两行 ——
	 * `paper_question` 没有 {@code (paper_id, question_id)} 唯一约束，
	 * 作答时同一题出现两次，`answer_record` 的唯一索引却只留 1 行，
	 * 最终 `exam_records.score` 与卷面 `total_score` 对不上。
	 */
	private void requireValidQuestions(List<PaperQuestionsUpdateReq.Item> questions) {
		if (questions == null || questions.isEmpty()) {
			throw new BusinessException(ValidationMessage.PAPER_QUESTION_EMPTY);
		}
		Set<Long> seen = new HashSet<>();
		for (PaperQuestionsUpdateReq.Item item : questions) {
			if (!seen.add(item.questionId())) {
				throw new BusinessException(
						ValidationMessage.PAPER_QUESTION_DUPLICATE + "，questionId=" + item.questionId());
			}
		}
	}
	
	/**
	 * 按 questionId 对一批题目去重，保留**最后一次**出现的元素（因此分值以最后一次为准）。
	 * <p>
	 * 增量加题接口（{@link #addPaperQuestions}）是幂等语义的「加或改」，不像
	 * {@link #replacePaperQuestions} 那样有 {@link #requireValidQuestions} 兜底 ——
	 * 同一批里同题出现两次时，不去重就会靠「查重是否命中」决定是插重复行还是覆盖分值，
	 * 结果不确定。而 {@code paper_question} 上没有 {@code (paper_id, question_id)} 唯一约束，
	 * 一旦插出重复行，该卷题目数虚高、作答记录又只留一行，总分会对不上。
	 */
	private <T> List<T> dedupeByQuestionId(List<T> items, java.util.function.ToLongFunction<T> idOf) {
		Map<Long, T> byId = new LinkedHashMap<>();
		for (T item : items) {
			byId.put(idOf.applyAsLong(item), item);   // 后写的覆盖先写的
		}
		return new ArrayList<>(byId.values());
	}
	
	public void requireOwnedPaper(long id) {
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
			throw new BusinessException(ValidationMessage.PAPER_TIME_WINDOW_REQUIRED);
		}
		if (end.isBefore(start)) {
			throw new BusinessException(ValidationMessage.PAPER_TIME_WINDOW_INVALID);
		}
	}
	
	/**
	 * 考试时长必须 > 0（`paper.duration`）。原来也写在 `PaperUpdateInput` 的构造器里。
	 */
	private void requireValidDuration(int duration) {
		if (duration <= 0) {
			throw new BusinessException("考试时长必须大于0");
		}
	}
	
	/**
	 * 「我的试卷」列表：强制按 `user_id` 过滤（含未发布草稿）。公开广场走 listPublishedPapers。
	 */
	public PageRes<Paper> listPapersByNameAndStatus(PaperListQuery conditions, Fetcher<Paper> fetcher) {
		// 以 **paper** 为查询根：建卷不再预写设置行，未配设置的卷也必须能出现在「我的试卷」里
		// （否则用户看不见它，也就永远进不了设置页去创建）。设置表走**左连接**：
		PaperTable paper = PaperTable.$;
		PaperExamSettingsTable settings = paper.examSettings(JoinType.LEFT);
		
		// 缺省：page=1、size=10；显式传入的非法值由记录类上的 @Min/@Max 拦成 422
		int page = conditions.page();
		int size = conditions.size();
		
		var query = paperRepository.sql().createQuery(paper)
				            .where(paper.userId().eq(StpUtil.getLoginIdAsLong()));
		
		var now = LocalDateTime.now();
		if (conditions.status() != null) {
			switch (conditions.status()) {
				case DRAFT:
					query.where(paper.published().eq(false));
					break;
				case PENDING:
					query.where(paper.published().eq(true), settings.start().ge(now));
					break;
				case PUBLISHED:
					query.where(paper.published().eq(true), settings.start().le(now), settings.end().ge(now));
					break;
				case FINISHED:
					query.where(paper.published().eq(true), settings.end().le(now));
					break;
				default:
					break;
			}
		}
		
		if (conditions.name() != null && !conditions.name().isBlank()) {
			query.where(paper.name().like(conditions.name().trim()));
		}
		if (conditions.categoryId() != null) {
			query.where(paper.categoryId().eq(conditions.categoryId()));
		}
		
		var res = query
				          .orderBy(paper.id().desc(), settings.end().desc())
				          .select(paper.fetch(fetcher))
				          .fetchPage(page - 1, size);
		return PageRes.<Paper>builder().page(page).pageSize(size).total(res.getTotalRowCount()).list(res.getRows()).build();
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
	
	/**
	 * 写入考试设置（**不含题目**）：存在则更新、不存在则新增（upsert）。
	 */
	@Transactional
	public void updatePaperExamSettings(long id, PaperExamSettingsInput input) {
		if (input == null) {
			throw new BusinessException("考试设置不能为空");
		}
		requireValidDuration(input.getDuration());
		requireTimeWindow(input.getStart(), input.getEnd());
		
		long me = StpUtil.getLoginIdAsLong();
		if (!paperRepository.existsByUserIdAndId(me, id)) {
			throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
		}
		
		// 只写设置表；试卷自身的名称/描述/分类/参与方式走 POST /paper/save
		saveExamSettings(id, input);
	}
	
	/**
	 * **整体替换**试卷题目集（`PUT /paper/{id}/questions`）。
	 * <p>
	 * 与增量的 {@link #addPaperQuestions} 不同：先清空该卷题目，再按本次提交的顺序写入。
	 * 写完后重算 `question_count` / `total_score`（原 updatePaper 漏了这步，会留脏值）。
	 */
	@Transactional
	public void replacePaperQuestions(long paperId, PaperQuestionsUpdateReq input) {
		long me = StpUtil.getLoginIdAsLong();
		
		// 多用户改造：试卷与要写入的题目都必须是自己的
		requireOwnedPaper(paperId);
		requireValidQuestions(input.questions());
		requireOwnedQuestions(me, input.questions().stream().map(PaperQuestionsUpdateReq.Item::questionId).toList());
		
		paperQuestionRepo.deleteByPaperId(paperId);
		
		paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setId(paperId);
			for (PaperQuestionsUpdateReq.Item item : input.questions()) {
				draft.addIntoPaperQuestions(pq -> {
					pq.setQuestionId(item.questionId());
					pq.setScore(item.score());
				});
			}
		}), SaveMode.UPDATE_ONLY, AssociatedSaveMode.APPEND);
		
		paperRepository.recalculateTotals(paperId);
	}
	
	@Transactional
	public void removePaper(long id) {
		// 多用户改造：只能删自己的卷
		// 试卷本身允许删除（即使已发布、即使已被考试引用）。
		// 注意：删掉已被考过的卷会让历史考试记录的 paper 悬空。
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
	
	/**
	 * 保存试卷（**新增 / 更新合一**）：入参带 id = 更新该卷，不带 id = 新增。
	 * <p>
	 * 只处理 4 个基本字段（名称/描述/分类/参与方式）；考试设置（时长/起止/次数/及格分/开关）
	 * 是 1:1 的另一张表 —— 由 {@link #updatePaperExamSettings} 维护；
	 * 新增时**不再**预写该行，发布前必须先配过设置（见 {@link #publishPaper}）。
	 *
	 * @return 试卷 id（新增返回新 id，更新返回原 id）
	 */
	@Transactional
	public long savePaper(PaperSaveInput input) {
		long userId = StpUtil.getLoginIdAsLong();
		
		// 多用户改造：分类必须是自己的
		requireOwnedPaperCategory(userId, input.getCategoryId());
		
		// 可空 id：null = 新增，非空 = 更新（存在性判断只用它，不信任前端其它字段）
		Long id = input.getId();
		if (id != null) {
			if (!paperRepository.existsByUserIdAndId(userId, id)) {
				throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
			}
			// 同名不能是别的卷
			if (paperRepository.existsByNameAndUserIdAndIdNot(userId, input.getName(), id)) {
				throw new BusinessException(MessageConstant.PAPER_NAME_EXIST);
			}
			paperRepository.save(PaperDraft.$.produce(draft -> {
				draft.setId(id);
				draft.setUserId(userId);
				draft.setName(input.getName());
				draft.setDescription(input.getDescription());
				draft.setCategoryId(input.getCategoryId());
				draft.setParticipateMode(input.getParticipateMode());
			}), SaveMode.UPDATE_ONLY);
			return id;
		}
		
		// 新增：判重按用户
		if (paperRepository.existsByUserIdAndName(userId, input.getName())) {
			throw new BusinessException(MessageConstant.PAPER_NAME_EXIST);
		}
		
		Paper paper = paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setUserId(userId);
			draft.setCategoryId(input.getCategoryId());
			draft.setName(input.getName());
			draft.setDescription(input.getDescription());
			draft.setParticipateMode(input.getParticipateMode());
			draft.setPublished(false);
			draft.setQuestionCount(0);
			draft.setTotalScore(0);
		}), SaveMode.INSERT_ONLY);
		return paper.id();
	}
	
	@Transactional
	public void publishPaper(long id) {
		// 多用户改造：只能发布自己的卷
		requireOwnedPaper(id);
		
		Paper paper = paperRepository.findById(id)
				              .orElseThrow(() -> new BusinessException(MessageConstant.PAPER_NOT_FOUND));
		if (paper.published()) {
			throw new BusinessException(MessageConstant.PAPER_IS_PUBLISHED);
		}
		// 发布前置条件：必须先配过考试设置 —— 没有设置行就没有时长/时间窗，发布了也无法开考
		if (!paperExamSettingsRepo.existsByPaperId(id)) {
			throw new BusinessException("请先完成考试设置再发布");
		}
		paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setId(id);
			draft.setPublished(true);
		}), SaveMode.UPDATE_ONLY);
	}
	
	@Transactional
	public void addPaperQuestions(long paperId, PaperQuestionAddReq input) {
		long me = StpUtil.getLoginIdAsLong();
		List<PaperQuestionAddReq.Item> raw = input.questions() != null ? input.questions() : List.of();
		// 同一批请求里同一道题可能出现多次：若不去重，第二条要么插出重复行、要么把前一条的
		// 分值覆盖掉（取决于查重是否命中），结果都不确定。这里以**最后一次**出现的分值为准。
		List<PaperQuestionAddReq.Item> items = dedupeByQuestionId(raw, PaperQuestionAddReq.Item::questionId);
		
		// 多用户改造：试卷与要加进去的题目都必须是自己的
		requireOwnedPaper(paperId);
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
	
	/**
	 * 从试卷中移除一道题。
	 * <p>
	 * 已发布的卷同样允许移除题目 —— 发布不再冻结题目。
	 * <p>
	 * ⚠️ 若该卷**已经被考过**，移除后历史答卷（{@code answer_record.question_id}）
	 * 会指向一道不再属于本卷的题，卷面总分也不再等于那次考试的满分。这是有意接受的代价，
	 * 历史记录本身不删、可继续查看。
	 */
	@Transactional
	public void removePaperQuestion(long paperId, long questionId) {
		// 多用户改造：只能改自己的卷
		requireOwnedPaper(paperId);
		
		paperQuestionRepo.deleteByPaperIdAndQuestionId(paperId, questionId);
		paperRepository.recalculateTotals(paperId);
	}
	
	@Transactional
	public void updatePaperQuestionScore(long paperId, long questionId, int score) {
		// 多用户改造：只能改自己的卷
		requireOwnedPaper(paperId);
		
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
			throw new BusinessException(ValidationMessage.PAPER_RULE_EMPTY);
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
		Paper saved = paperRepository.save(PaperDraft.$.produce(draft -> {
			draft.setUserId(me);
			draft.setCategoryId(dto.getCategoryId());
			draft.setName(dto.getName());
			draft.setDescription(dto.getDescription());
			draft.setPublished(false);
			// 智能组卷路径暂不提供参与方式与开关的入口，用默认值（与 addPaper 不传时一致）
			draft.setParticipateMode(DEFAULT_PARTICIPATE_MODE);
			draft.setQuestionCount(finalQuestionCount);
			draft.setTotalScore(finalTotalScore);
			for (Map.Entry<Long, Integer> entry : questionScores.entrySet()) {
				draft.addIntoPaperQuestions(pq -> {
					pq.setQuestionId(entry.getKey());
					pq.setScore(entry.getValue());
				});
			}
		}), SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND);
		return saved;
	}
}
