package com.yyjy.exam.question.common;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.yyjy.exam.entity.question.dto.QuestionImportView;
import com.yyjy.exam.entity.question.entity.QuestionDifficulty;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.question.bo.QuestionExcelTemplateBo;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

/**
 * Excel 试题模板的解析器：把「大白话」翻译成结构化的 {@link QuestionImportView}。
 * <p>
 * 只做翻译，不碰数据库：分类名 → 分类 id 的落库（不存在则创建）在
 * {@code QuestionService.importFromExcel} 里做，解析结果通过 {@link #getCategoryNames()} 按行带出。
 * <p>
 * 题型自动推断口径：
 * <pre>
 * 填了选项 + 答案 1 个字母        → SINGLE_CHOICE，answer 存 "B"
 * 填了选项 + 答案 2 个及以上字母  → MULTIPLE_CHOICE，answer 存 "A,C"
 * 没填选项 + 答案 对 / 错         → JUDGE，answer 存 "true" / "false"
 * 没填选项 + 其他答案             → TEXT，answer 存原文
 * </pre>
 * 选择题的 {@code choices[].correct} 与 {@code answer} 由**同一个字母集合**推导，按选项下标对应
 * A / B / C / D —— 与 {@code QuestionService.processChoice} 口径一致，不再出现
 * 「答案存字母、correct 却按选项文本 contains 判」这种两套标准打架的问题。
 */
public class QuestionExcelListener extends AnalysisEventListener<QuestionExcelTemplateBo> {
	
	private static final List<String> LETTERS = List.of("A", "B", "C", "D");
	
	/** 判断题的 true 写法。刻意不收录「是 / 否」—— 那更像简答题的答案文本，收录会误判题型。 */
	private static final Set<String> JUDGE_TRUE = Set.of("对", "正确", "√", "true", "t");
	
	/** 判断题的 false 写法。 */
	private static final Set<String> JUDGE_FALSE = Set.of("错", "错误", "×", "x", "false", "f");
	
	private static final Map<String, QuestionDifficulty> DIFFICULTY_ALIAS = buildDifficultyAlias();
	
	/** questions.title 是 varchar(255)，超了 MySQL 直接报 Data too long（整批回滚），所以提前拦。 */
	private static final int MAX_TITLE_LENGTH = 255;
	
	/** questions_categories.name 是 varchar(100)。 */
	private static final int MAX_CATEGORY_NAME_LENGTH = 100;
	
	private final List<QuestionImportView> datas = new ArrayList<>();
	
	/** 与 {@link #datas} 同索引：第 i 题填的分类名（此时还没建分类，所以只有名字没有 id）。 */
	private final List<String> categoryNames = new ArrayList<>();
	
	private final List<String> errors = new ArrayList<>();
	
	/** 校验失败被跳过的行数（{@link #errors} 是消息明细，一行可能有多条） */
	private int failedRows;
	
	private static Map<String, QuestionDifficulty> buildDifficultyAlias() {
		Map<String, QuestionDifficulty> m = new HashMap<>();
		for (String s : List.of("容易", "简单", "易", "低", "easy")) m.put(s, QuestionDifficulty.EASY);
		for (String s : List.of("中等", "一般", "中", "medium")) m.put(s, QuestionDifficulty.MEDIUM);
		for (String s : List.of("困难", "难", "高", "hard")) m.put(s, QuestionDifficulty.HARD);
		return Map.copyOf(m);
	}
	
	@Override
	public void invoke(QuestionExcelTemplateBo data, AnalysisContext context) {
		// 表头占第 1 行，所以 Excel 里看到的行号 = rowIndex + 1。
		// 不能再用 datas.size() + 1：中间只要有行被跳过（校验失败）就会整体错位。
		int rowNo = context.readRowHolder().getRowIndex() + 1;
		String prefix = rowNo + " 行";
		List<String> rowErrors = new ArrayList<>();
		
		String content = trimToNull(data.getContent());
		String rawAnswer = trimToNull(data.getAnswer());
		String categoryPath = trimToNull(data.getCategoryName());
		
		if (content == null) {
			rowErrors.add(prefix + "：试题内容不能为空");
		} else if (content.length() > MAX_TITLE_LENGTH) {
			rowErrors.add(prefix + "：试题内容最多 " + MAX_TITLE_LENGTH + " 个字，当前 " + content.length() + " 个");
		}
		
		if (rawAnswer == null) rowErrors.add(prefix + "：答案不能为空");
		
		if (categoryPath == null) {
			rowErrors.add(prefix + "：分类名不能为空");
		} else {
			for (String segment : splitCategoryPath(categoryPath)) {
				if (segment.length() > MAX_CATEGORY_NAME_LENGTH) {
					rowErrors.add(prefix + "：分类名「" + segment + "」超过 " + MAX_CATEGORY_NAME_LENGTH + " 个字");
				}
			}
		}
		
		List<String> options = new ArrayList<>();
		for (String raw : new String[]{data.getChoiceA(), data.getChoiceB(), data.getChoiceC(), data.getChoiceD()}) {
			options.add(trimToNull(raw));
		}
		int optionCount = (int) options.stream().filter(Objects::nonNull).count();
		if (optionCount >= 1 && hasGap(options)) {
			rowErrors.add(prefix + "：选项要连续填写，中间不能留空（例如只填了 A、C）");
		}
		
		QuestionDifficulty difficulty = parseDifficulty(data.getDifficulty(), rowErrors, prefix);
		int score = parseScore(data.getScore(), rowErrors, prefix);
		
		QuestionType type;
		String answer;
		List<QuestionImportView.TargetOf_choices> choices = null;
		
		if (optionCount >= 1) {
			if (optionCount < 2) {
				rowErrors.add(prefix + "：选择题至少需要两个选项");
			}
			
			List<String> letters = extractLetters(rawAnswer, options);
			if (letters.isEmpty()) {
				rowErrors.add(prefix + "：选择题的答案请填选项字母，例如 B 或 ABC");
			}
			
			type = letters.size() > 1 ? QuestionType.MULTIPLE_CHOICE : QuestionType.SINGLE_CHOICE;
			answer = String.join(",", letters);
			
			choices = new ArrayList<>();
			for (int i = 0; i < options.size(); i++) {
				String optionContent = options.get(i);
				if (optionContent == null) continue;
				QuestionImportView.TargetOf_choices choice = new QuestionImportView.TargetOf_choices();
				choice.setContent(optionContent);
				// 字母与选项按**下标**对应，且与 answer 同源
				choice.setCorrect(letters.contains(LETTERS.get(i)));
				choice.setSort(i);
				choices.add(choice);
			}
		} else {
			Boolean judge = parseJudgeAnswer(rawAnswer);
			if (judge == null) {
				type = QuestionType.TEXT;
				answer = rawAnswer;
			} else {
				type = QuestionType.JUDGE;
				answer = judge ? "true" : "false";
			}
		}
		
		if (!rowErrors.isEmpty()) {
			errors.addAll(rowErrors);
			failedRows++;
			return;
		}
		
		QuestionImportView question = new QuestionImportView();
		question.setTitle(content);
		question.setType(type);
		question.setDifficulty(difficulty);
		question.setScore(score);
		question.setAnalysis(trimToNull(data.getAnalysis()));
		question.setAnswer(answer);
		question.setChoices(choices);
		// categoryId 故意不设：分类名要等 Service 层「查库 / 建库」之后才能确定，见 QuestionService.importFromExcel
		datas.add(question);
		categoryNames.add(categoryPath);
	}
	
	@Override
	public void doAfterAllAnalysed(AnalysisContext context) {
	}
	
	public List<QuestionImportView> getDatas() {
		return datas;
	}
	
	/** 与 {@link #getDatas()} 同索引的分类名，供 Service 层逐级查找 / 创建分类。 */
	public List<String> getCategoryNames() {
		return categoryNames;
	}
	
	public List<String> getErrors() {
		return errors;
	}
	
	/** 校验失败被跳过的行数 */
	public int getFailedRows() {
		return failedRows;
	}
	
	/**
	 * 「分类名」→ 逐级分类名，用于按层查找、不存在则创建：
	 * <pre>
	 * 数学/算数  → ["数学", "算数"]
	 * 数学       → ["数学"]
	 * </pre>
	 * 分隔符同时接受 {@code /}、{@code ／}、{@code >}、{@code \}，空白段会被丢弃。
	 */
	public static List<String> splitCategoryPath(String path) {
		if (path == null) return List.of();
		return Arrays.stream(normalize(path).split("[/>\\\\]"))
				       .map(String::trim)
				       .filter(s -> !s.isEmpty())
				       .toList();
	}
	
	/**
	 * 从答案里取选项字母，去重并按 A→D 升序。
	 * <p>
	 * 兼容两种写法：① 字母串 {@code B} / {@code ABC} / {@code A,B,C}（含全角、小写、乱序）；
	 * ② 直接填选项内容 —— 精确匹配到某个选项时换回字母，兜住历史数据。
	 */
	private static List<String> extractLetters(String rawAnswer, List<String> options) {
		if (rawAnswer == null) return List.of();
		
		Set<String> hits = new TreeSet<>();
		for (char ch : normalize(rawAnswer).toUpperCase().toCharArray()) {
			String letter = String.valueOf(ch);
			if (LETTERS.contains(letter)) hits.add(letter);
		}
		
		if (hits.isEmpty()) {
			String normalized = normalize(rawAnswer).trim();
			for (int i = 0; i < options.size(); i++) {
				String optionContent = options.get(i);
				if (optionContent != null && optionContent.equalsIgnoreCase(normalized)) {
					hits.add(LETTERS.get(i));
				}
			}
		}
		return new ArrayList<>(hits);
	}
	
	private static Boolean parseJudgeAnswer(String rawAnswer) {
		if (rawAnswer == null) return null;
		String v = normalize(rawAnswer).trim().toLowerCase();
		if (JUDGE_TRUE.contains(v)) return Boolean.TRUE;
		if (JUDGE_FALSE.contains(v)) return Boolean.FALSE;
		return null;
	}
	
	private static QuestionDifficulty parseDifficulty(String raw, List<String> rowErrors, String prefix) {
		String v = trimToNull(raw);
		if (v == null) return QuestionDifficulty.MEDIUM;
		
		QuestionDifficulty difficulty = DIFFICULTY_ALIAS.get(normalize(v).trim().toLowerCase());
		if (difficulty == null) {
			rowErrors.add(prefix + "：难度「" + v + "」无法识别，请填 容易 / 中等 / 困难");
			return QuestionDifficulty.MEDIUM;
		}
		return difficulty;
	}
	
	private static int parseScore(String raw, List<String> rowErrors, String prefix) {
		String v = trimToNull(raw);
		if (v == null) return 1;
		
		try {
			int score = Integer.parseInt(normalize(v).trim());
			if (score <= 0) {
				rowErrors.add(prefix + "：分值必须是大于 0 的整数");
				return 1;
			}
			return score;
		} catch (NumberFormatException e) {
			rowErrors.add(prefix + "：分值「" + v + "」不是整数");
			return 1;
		}
	}
	
	/** A 有、B 空、C 有 这种空洞会让字母与选项错位，直接报错，不做静默重排。 */
	private static boolean hasGap(List<String> options) {
		boolean seenEmpty = false;
		for (String option : options) {
			if (option == null) {
				seenEmpty = true;
			} else if (seenEmpty) {
				return true;
			}
		}
		return false;
	}
	
	/** 全角转半角，这样「，」「ＡＢＣ」「　」都能按半角处理。 */
	private static String normalize(String s) {
		StringBuilder sb = new StringBuilder(s.length());
		for (char c : s.toCharArray()) {
			if (c == 0x3000) {
				sb.append(' ');
			} else if (c >= 0xFF01 && c <= 0xFF5E) {
				sb.append((char) (c - 0xFEE0));
			} else {
				sb.append(c);
			}
		}
		return sb.toString();
	}
	
	private static String trimToNull(String s) {
		if (s == null) return null;
		String v = normalize(s).trim();
		return v.isEmpty() ? null : v;
	}
}
