package com.yyjy.exam.question.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.dto.QuestionImportInput;
import com.yyjy.exam.entity.question.dto.QuestionSaveInput;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.entity.question.entity.Questions;
import com.yyjy.exam.entity.question.entity.QuestionsCategoriesTable;
import com.yyjy.exam.entity.question.entity.QuestionsDraft;
import com.yyjy.exam.entity.question.entity.QuestionsTable;
import com.yyjy.exam.question.bo.QuestionImportResult;
import com.yyjy.exam.question.repository.QuestionsRepository;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 批量导入的入库层。
 * <p>
 * 2026-09-20 重写（旧版逐行查分类 + 逐行 save，N 行要 2N 次往返，且没有判重）：
 * <ol>
 *   <li><b>分类归属一次查完</b>：把所有 categoryId 收成一个集合做一次 in 查询，不再逐行查库；</li>
 *   <li><b>判重</b>：文件内同 (type, title) 只保留第一条；库里已有同 (user, type, title) 的整条跳过；</li>
 *   <li><b>批量入库</b>：先全量校验通过再 {@code saveEntities}，避免"前几行已写、后面抛异常"；</li>
 *   <li><b>返回可读报告</b>：成功多少条、跳过多少条重复，而不是一句"批量导入成功 N/M"。</li>
 * </ol>
 * 注意 {@code Questions} 实体没有 {@code @Key}，所以必须显式 {@code SaveMode.INSERT_ONLY}，
 * 否则 Jimmer 会因为"既无 id 也无 key"直接拒绝。
 */
@Service
public class QuestionImportService {
	
	/** 单次导入的行数上限：防止一个超大 Excel 把内存和事务撑爆。 */
	public static final int MAX_IMPORT_ROWS = 1000;
	
	private final QuestionsRepository questionsRepository;
	private final JSqlClient sqlClient;
	
	public QuestionImportService(QuestionsRepository questionsRepository, JSqlClient sqlClient) {
		this.questionsRepository = questionsRepository;
		this.sqlClient = sqlClient;
	}
	
	@Transactional
	public QuestionImportResult importBatch(List<QuestionImportInput> questions) {
		if (questions.isEmpty()) {
			throw new BusinessException(MessageConstant.QUESTION_NOT_EMPTY);
		}
		if (questions.size() > MAX_IMPORT_ROWS) {
			throw new BusinessException("单次最多导入 " + MAX_IMPORT_ROWS + " 条，当前 " + questions.size() + " 条");
		}
		
		long me = StpUtil.getLoginIdAsLong();
		
		// ① 分类归属：一次查完，不逐行查库（多用户改造：只能导入到自己的分类下）
		requireOwnedCategories(questions, me);
		
		// ② 判重：文件内重复 + 库里已有，都跳过而不是插成重复题
		Set<String> seenInFile = new HashSet<>();
		Set<String> existingInDb = loadExistingKeys(questions, me);
		List<Questions> toInsert = new ArrayList<>();
		Set<String> duplicated = new LinkedHashSet<>();
		for (QuestionImportInput item : questions) {
			String key = key(item.getType(), item.getTitle());
			if (!seenInFile.add(key) || existingInDb.contains(key)) {
				duplicated.add(item.getTitle());
				continue;
			}
			// 多用户改造：owner 由服务端注入（DTO 里没有 userId，客户端无法伪造）
			toInsert.add(QuestionsDraft.$.produce(
					buildSaveInput(item).toEntity(),
					d -> d.setUserId(me)));
		}
		
		// ③ 批量入库（choices / answers 随主表一起 append）
		if (!toInsert.isEmpty()) {
			questionsRepository.saveEntities(toInsert, SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND);
		}
		
		QuestionImportResult result = new QuestionImportResult();
		result.setParsed(questions.size());
		result.setImported(toInsert.size());
		result.setDuplicated(duplicated.size());
		result.setDuplicatedTitles(duplicated.stream().limit(10).map(QuestionImportService::brief).toList());
		return result;
	}
	
	/** 所有 categoryId 一次性做归属校验；有缺失就整体拒绝（不静默丢行）。 */
	private void requireOwnedCategories(List<QuestionImportInput> questions, long me) {
		Set<Long> categoryIds = new HashSet<>();
		for (QuestionImportInput item : questions) {
			categoryIds.add(item.getCategoryId());
		}
		
		var t = QuestionsCategoriesTable.$;
		Set<Long> owned = new HashSet<>(sqlClient.createQuery(t)
				                                   .where(t.userId().eq(me))
				                                   .where(t.id().in(categoryIds))
				                                   .select(t.id())
				                                   .execute());
		
		List<Long> missing = categoryIds.stream()
				                     .filter(id -> !owned.contains(id))
				                     .sorted()
				                     .toList();
		if (!missing.isEmpty()) {
			throw new BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST + " " + missing);
		}
	}
	
	/** 按标题粗筛出库里已有的题，再在内存里比对 (type, title)。 */
	private Set<String> loadExistingKeys(List<QuestionImportInput> questions, long me) {
		Set<String> titles = new HashSet<>();
		for (QuestionImportInput item : questions) {
			titles.add(item.getTitle());
		}
		
		var qt = QuestionsTable.$;
		List<Questions> existing = sqlClient.createQuery(qt)
				                           .where(qt.userId().eq(me))
				                           .where(qt.title().in(titles))
				                           .select(qt)
				                           .execute();
		
		Set<String> keys = new HashSet<>();
		for (Questions question : existing) {
			keys.add(key(question.type(), question.title()));
		}
		return keys;
	}
	
	private static String key(QuestionType type, String title) {
		return type + "\u0000" + title;
	}
	
	private QuestionSaveInput buildSaveInput(QuestionImportInput item) {
		var saveInput = new QuestionSaveInput.Builder()
				                .title(item.getTitle())
				                .type(item.getType())
				                .categoryId(item.getCategoryId())
				                .difficulty(item.getDifficulty())
				                .score(item.getScore())
				                .analysis(item.getAnalysis());
		
		// question_answers.answer 是 NOT NULL，缺答案时兜空串
		QuestionSaveInput.TargetOf_answers answers = new QuestionSaveInput.TargetOf_answers();
		answers.setAnswer(item.getAnswer() != null ? item.getAnswer() : "");
		saveInput.answers(answers);
		
		// ⚠️ 括号不能省：写成 `A.equals(...) || B.equals(...) && choices != null` 时，
		// 受 && 优先级影响实际是 `A || (B && C)`，单选分支会在 choices 为 null 时进来并 NPE。
		boolean isChoice = QuestionType.SINGLE_CHOICE.equals(item.getType())
				                   || QuestionType.MULTIPLE_CHOICE.equals(item.getType());
		if (isChoice && item.getChoices() != null) {
			List<QuestionSaveInput.TargetOf_choices> choices = new ArrayList<>();
			for (QuestionImportInput.TargetOf_choices importChoice : item.getChoices()) {
				QuestionSaveInput.TargetOf_choices choice = new QuestionSaveInput.TargetOf_choices();
				choice.setContent(importChoice.getContent());
				choice.setCorrect(importChoice.getCorrect());
				choice.setSort(importChoice.getSort());
				choices.add(choice);
			}
			saveInput.choices(choices);
		}
		return saveInput.build();
	}
	
	private static String brief(String title) {
		if (title == null) return "";
		return title.length() > 20 ? title.substring(0, 20) + "…" : title;
	}
}
