package com.yyjy.exam.question.service;

import cn.dev33.satoken.stp.StpUtil;
import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.write.style.column.LongestMatchColumnWidthStyleStrategy;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.constant.ValidationMessage;
import com.yyjy.exam.entity.question.dto.*;
import com.yyjy.exam.entity.question.entity.*;
import com.yyjy.exam.entity.question.io.req.*;
import com.yyjy.exam.entity.question.io.res.QuestionGenerateDto;
import com.yyjy.exam.entity.question.io.res.QuestionPageRes;
import com.yyjy.exam.paper.repository.PaperQuestionRepository;
import com.yyjy.exam.paper.repository.PaperRepository;
import com.yyjy.exam.question.bo.QuestionExcelTemplateBo;
import com.yyjy.exam.question.bo.QuestionImportResult;
import com.yyjy.exam.question.common.QuestionExcelListener;
import com.yyjy.exam.question.repository.CategoriesRepository;
import com.yyjy.exam.question.repository.QuestionAnswersRepository;
import com.yyjy.exam.question.repository.QuestionChoicesRepository;
import com.yyjy.exam.question.repository.QuestionsRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QuestionService {
	
	/**
	 * 模板本体所在 sheet。解析端 {@code EasyExcel.read(...).sheet()} 只读第 0 个 sheet。
	 */
	private static final String TEMPLATE_SHEET = "题目模板";
	
	/**
	 * 填写说明 sheet，固定放在最后，不参与导入。
	 */
	private static final String NOTE_SHEET = "填写说明";
	
	private final QuestionsRepository questionsRepository;
	private final QuestionChoicesRepository questionChoicesRepository;
	private final QuestionAnswersRepository questionAnswersRepository;
	private final CategoriesRepository categoriesRepository;
	private final QuestionImportService questionImportService;
	private final QuestionGenerateService questionGenerateService;
	private final PaperQuestionRepository paperQuestionRepository;
	private final PaperRepository paperRepository;
	private final JSqlClient sqlClient;
	
	private static void requireExcelFile(MultipartFile file) {
		if (file.isEmpty()) {
			throw new BusinessException(ValidationMessage.FILE_NOT_EMPTY);
		}
		String filename = file.getOriginalFilename();
		if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
			throw new BusinessException(ValidationMessage.FILE_FORMAT_ERROR);
		}
	}
	
	/**
	 * 读第 0 个 sheet（模板本体）；第 2 个「填写说明」不参与解析。
	 */
	private static QuestionExcelListener readExcel(MultipartFile file) {
		try {
			QuestionExcelListener listener = new QuestionExcelListener();
			EasyExcel.read(file.getInputStream(), QuestionExcelTemplateBo.class, listener).sheet().doRead();
			return listener;
		} catch (IOException e) {
			throw new BusinessException("解析Excel失败");
		}
	}
	
	private static String categoryKey(long parentId, String name) {
		return parentId + "\u0000" + name;
	}
	
	private static List<List<String>> noteHead() {
		return List.of(List.of("字段"), List.of("是否必填"), List.of("怎么填"));
	}
	
	/**
	 * 填写说明 sheet 的内容，与模板同源维护，改模板列时记得一起改。
	 */
	private static List<List<String>> createTemplateNotes() {
		List<List<String>> rows = new ArrayList<>();
		
		rows.add(List.of("【字段说明】", "", ""));
		rows.add(List.of("试题内容", "必填", "题干文字，最长 255 个字。"));
		rows.add(List.of("选项A ~ 选项D", "选填", "选择题填，至少两个，且要连续填、中间不能留空；判断题 / 简答题留空。"));
		rows.add(List.of("答案", "必填", "单选填字母，如 B；多选直接连写，如 ABC（写 A,B,C 也行）；"
				                                 + "判断题填 对 / 错（也认 √ / × / true / false）；简答题填参考答案原文。"));
		rows.add(List.of("分类名", "必填", "支持多级，用 / 分隔，例如 数学/算数。"
				                                   + "不存在的分类会自动创建（父级不存在时父子一起建）。"));
		rows.add(List.of("难度", "选填", "容易 / 中等 / 困难（也认 简单、难、EASY、MEDIUM、HARD）。留空按「中等」处理。"));
		rows.add(List.of("分值", "选填", "大于 0 的整数。留空按 1 分处理。"));
		rows.add(List.of("解析", "选填", "答案解析，可留空。"));
		
		rows.add(List.of("", "", ""));
		rows.add(List.of("【题型不用填，按选项和答案自动判断】", "", ""));
		rows.add(List.of("单选题", "自动", "填了选项 + 答案只有 1 个字母"));
		rows.add(List.of("多选题", "自动", "填了选项 + 答案有 2 个及以上字母"));
		rows.add(List.of("判断题", "自动", "没填选项 + 答案填 对 / 错（或 true / false）"));
		rows.add(List.of("简答题", "自动", "没填选项 + 答案填其他内容"));
		
		rows.add(List.of("", "", ""));
		rows.add(List.of("【其他】", "", ""));
		rows.add(List.of("示例行", "提醒", "第 2 行起都是示例，正式导入前请删掉，只留自己的数据。"));
		rows.add(List.of("表头", "提醒", "第 1 行表头不要改名字（列的前后顺序可以调）。"));
		rows.add(List.of("有行填错时", "提醒", "该行不会被导入，其余行照常导入；"
				                                       + "接口会返回「第几行、错在哪」，改完重新上传即可。"));
		
		return rows;
	}
	
	/**
	 * 多用户改造：题目归属校验的统一出口（决策台账 Q5 / Q25）。
	 * 纯 owner 相等判断，**没有身份分支** —— 不给 admin 开后门。
	 * 走 Table.userId() 而不是 question.userId()：实体按决定只加了 user()，没加 @IdView。
	 */
	public void requireOwnedQuestion(long id) {
		long me = StpUtil.getLoginIdAsLong();
		QuestionsTable t = QuestionsTable.$;
		List<Long> owners = sqlClient.createQuery(t)
				                    .where(t.id().eq(id))
				                    .select(t.userId())
				                    .execute();
		if (owners.isEmpty()) {
			throw new BusinessException(MessageConstant.QUESTION_NOT_EXIST);
		}
		if (owners.getFirst() != me) {
			throw new BusinessException(MessageConstant.NOT_YOUR_RESOURCE);
		}
	}
	
	@Transactional
	public Questions save(QuestionSaveReq req) {
		long me = StpUtil.getLoginIdAsLong();
		
		// 多用户改造：判重与分类校验都必须限定在"我自己的"范围内
		if (questionsRepository.existsByUserIdAndTypeAndTitle(me, req.getType(), req.getTitle())) {
			throw new BusinessException(MessageConstant.QUESTION_EXIST);
		}
		
		if (!categoriesRepository.ownedBy(req.getCategoryId(), me)) {
			throw new BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST);
		}
		
		// 多用户改造：owner 由服务端注入（DTO 里没有该字段，客户端无法伪造）
		return questionsRepository.save(
				QuestionsDraft.$.produce(buildSaveInput(req).toEntity(), d -> d.setUserId(me)),
				SaveMode.INSERT_ONLY,
				AssociatedSaveMode.APPEND);
	}
	
	/**
	 * 把 add / update 共用的「type + 多态 extra」请求模型翻译成 Jimmer 的 QuestionSaveInput。
	 * 题型差异只在 {@link QuestionExtra} 的子类上分派一处，两个入口不再各写一套 if。
	 */
	private QuestionSaveInput buildSaveInput(QuestionSaveReq req) {
		var builder = new QuestionSaveInput.Builder()
				              .title(req.getTitle())
				              .type(req.getType())
				              .categoryId(req.getCategoryId())
				              .difficulty(req.getDifficulty())
				              .score(req.getScore())
				              .analysis(req.getAnalysis());
		
		if (req.getExtra() instanceof SingleChoiceExtra sc) {
			processChoice(builder, sc.getChoices(), false);
		} else if (req.getExtra() instanceof MultipleChoiceExtra mc) {
			processChoice(builder, mc.getChoices(), true);
		} else if (req.getExtra() instanceof JudgeExtra j) {
			var answers = new QuestionSaveInput.TargetOf_answers();
			answers.setAnswer(j.getAnswer());
			builder.answers(answers);
		} else if (req.getExtra() instanceof TextExtra t) {
			if (t.getAnswer() != null) {
				var answers = new QuestionSaveInput.TargetOf_answers();
				answers.setAnswer(t.getAnswer());
				builder.answers(answers);
			}
		}
		return builder.build();
	}
	
	private void processChoice(QuestionSaveInput.Builder builder, List<ChoiceDto> choiceDtos, boolean allowMultiple) {
		if (choiceDtos == null || choiceDtos.isEmpty()) {
			throw new BusinessException(ValidationMessage.QUESTION_CHOICE_CHOICES_NOT_EMPTY);
		}
		List<QuestionSaveInput.TargetOf_choices> choices = new ArrayList<>();
		StringBuilder answerStr = new StringBuilder();
		for (int i = 0; i < choiceDtos.size(); i++) {
			ChoiceDto dto = choiceDtos.get(i);
			var choice = new QuestionSaveInput.TargetOf_choices();
			choice.setContent(dto.getContent());
			choice.setCorrect(dto.getCorrect());
			choice.setSort(i);
			choices.add(choice);
			
			if (Boolean.TRUE.equals(dto.getCorrect())) {
				if (!answerStr.isEmpty()) {
					if (!allowMultiple) {
						throw new BusinessException("单选题只能有一个正确答案");
					}
					answerStr.append(",");
				}
				answerStr.append((char) ('A' + i));
			}
		}
		builder.choices(choices);
		
		var answers = new QuestionSaveInput.TargetOf_answers();
		answers.setAnswer(answerStr.toString());
		builder.answers(answers);
	}
	
	@Transactional
	public Questions update(long id, QuestionSaveReq req) {
		long me = StpUtil.getLoginIdAsLong();
		
		// 多用户改造：① 题目必须是自己的；② 目标分类也必须是自己的
		requireOwnedQuestion(id);
		
		if (!categoriesRepository.ownedBy(req.getCategoryId(), me)) {
			throw new BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST);
		}
		
		// 查询题目是否存在
		questionsRepository.findById(id)
				.orElseThrow(() -> new BusinessException(MessageConstant.QUESTION_NOT_EXIST));
		
		// 查询同类型下是否有同名题目（按 owner 判重，并排除题目自身）。
		// 用请求里的 type 而不是库里的旧 type：改题型时按改完之后的类型判重才对。
		if (questionsRepository.existsByUserIdAndTypeAndTitleExcludingId(
				me, req.getType(), req.getTitle(), id)) {
			throw new BusinessException(MessageConstant.QUESTION_EXIST);
		}
		
		// 与 add 统一口径：选项与答案都「先删旧、再按本次提交重建」。
		// 所以 answers 不再需要行 id，也天然支持「选择题 ↔ 判断题」这类改题型；
		// 而「选项至少两个」等校验在进本方法前已由 @Valid + Extra 子类拦下，删不到数据。
		questionChoicesRepository.deleteByQuestionId(id);
		questionAnswersRepository.deleteByQuestionId(id);
		
		return questionsRepository.save(
				QuestionsDraft.$.produce(buildSaveInput(req).toEntity(), d -> d.setId(id)),
				SaveMode.UPDATE_ONLY,
				AssociatedSaveMode.APPEND);
	}
	
	/**
	 * 删除题目。题目本身不可恢复，且会**连带**做三件事：
	 * <ol>
	 *   <li>摘掉它在所有试卷里的引用（否则 paper_question 会留下悬空 question_id，
	 *       导致引用它的试卷 GET /paper/{id} 直接 500）；</li>
	 *   <li>重算受影响的每张试卷的冗余列（question_count / total_score）；</li>
	 *   <li>删掉它的选项与答案（库里没有外键约束，不删就是孤儿数据）。</li>
	 * </ol>
	 * 题目与试卷都只可能是自己的（归属在加题时就已约束），所以这里不再逐个校验试卷归属。
	 * 已发布的试卷同样会被摘掉引用 —— 删题是题库侧操作，不适用"已发布卷题目冻结"。
	 */
	@Transactional
	public void remove(long id) {
		// 多用户改造：只能删自己的题
		requireOwnedQuestion(id);
		
		// 先摘引用并拿到受影响的试卷，再删题目本体（顺序无所谓，但要同一个事务）
		List<Integer> affectedPaperIds = paperQuestionRepository.deleteByQuestionId(id);
		questionChoicesRepository.deleteByQuestionId(id);
		questionAnswersRepository.deleteByQuestionId(id);
		questionsRepository.deleteById(id);
		
		for (int paperId : affectedPaperIds) {
			paperRepository.recalculateTotals(paperId);
		}
	}
	
	public QuestionsPageView getById(long id) {
		// 多用户改造：只能看自己的题
		requireOwnedQuestion(id);
		
		QuestionsPageView question = questionsRepository.sql().getEntities().findById(QuestionsPageView.class, id);
		Optional.ofNullable(question).orElseThrow(() -> new BusinessException(MessageConstant.QUESTION_NOT_EXIST));
		
		return question;
	}
	
	public QuestionPageRes list(QuestionListReq req) {
		int page = req.page() != null ? req.page() : 1;
		// size 缺省为 20；显式传入时按其值，但钳制在 [1, 100] 内，避免恶意超大分页。
		int size = req.size() != null ? Math.clamp(req.size(), 1, 100) : 20;
		
		QuestionsTable t = QuestionsTable.$;
		// 多用户改造：列表只看自己的题（没有 admin 分支）
		var query = sqlClient.createQuery(t).where(t.userId().eq(StpUtil.getLoginIdAsLong()));
		
		if (req.keyword() != null && !req.keyword().isBlank()) {
			query = query.where(t.title().like("%" + req.keyword().trim() + "%"));
		}
		if (req.categoryId() != null) {
			query = query.where(t.categoryId().eq(req.categoryId()));
		}
		if (req.difficulty() != null) {
			query = query.where(t.difficulty().eq(req.difficulty()));
		}
		if (req.type() != null) {
			query = query.where(t.type().eq(req.type()));
		}
		var pageResult = query.select(t.fetch(QuestionsPageView.class)).fetchPage(page - 1, size);
		
		List<QuestionsPageView> records = pageResult.getRows();
		return QuestionPageRes.builder()
				       .records(records)
				       .total(pageResult.getTotalRowCount())
				       .pages(pageResult.getTotalPageCount())
				       .size(size)
				       .current(page)
				       .build();
	}
	
	public void exportTemplate(HttpServletResponse response) {
		try {
			// 设置响应结果类型
			// ms-excel: 微软的excel格式
			response.setContentType("application/vnd.ms-excel");
			response.setCharacterEncoding("utf-8");
			// 防止中文乱码
			String fileName = URLEncoder.encode("Excel题目模板", StandardCharsets.UTF_8);
			// 设置响应头Content-Disposition标识任何格式都以下载方式打开
			response.addHeader("Content-Disposition", "attachment;filename=" + fileName + ".xlsx");
			
			// 生成模板文件：两个 sheet —— 第 0 个是模板本体（解析端只读它），第 1 个是填写说明
			ExcelWriter writer = EasyExcel.write(response.getOutputStream())
					                     .registerWriteHandler(new LongestMatchColumnWidthStyleStrategy())
					                     .build();
			try {
				writer.write(createTemplateRows(),
						EasyExcel.writerSheet(0, TEMPLATE_SHEET).head(QuestionExcelTemplateBo.class).build());
				writer.write(createTemplateNotes(),
						EasyExcel.writerSheet(1, NOTE_SHEET).head(noteHead()).build());
			} finally {
				writer.finish();
			}
		} catch (Exception e) {
			throw new BusinessException("导出模板失败");
		}
	}
	
	/**
	 * 从 Excel 一次性完成「解析 → 分类解析 → 入库」，返回逐行报告。
	 * <p>
	 * 批量导入的**唯一入口**：文件直传，解析与入库都在服务端完成，分类名不会离开服务端。
	 * 口径是「能导的导、导不了的说明原因」——填错的行被跳过并带行号返回，其余照常入库，
	 * 而不是一行有问题就把整份文件丢掉。
	 */
	@Transactional
	public QuestionImportResult importFromExcel(MultipartFile file) {
		requireExcelFile(file);
		
		long me = StpUtil.getLoginIdAsLong();
		QuestionExcelListener listener = readExcel(file);
		
		List<QuestionImportView> views = listener.getDatas();
		CategoryIndex index = loadCategoryIndex(me);
		int categoriesBefore = index.byPath().size();
		assignCategoryIds(views, listener.getCategoryNames(), me, index);
		
		QuestionImportResult result = questionImportService.importBatch(
				views.stream().map(this::convertImportViewToInput).toList());
		result.setFailed(listener.getFailedRows());
		result.setErrors(listener.getErrors());
		result.setCategoriesCreated(index.byPath().size() - categoriesBefore);
		return result;
	}
	
	public QuestionImportResult importBatch(List<QuestionImportInput> questions) {
		return questionImportService.importBatch(questions);
	}
	
	/**
	 * 把每行的分类名解析成真实 id（不存在则建）。同一份文件里同名的只解析一次。
	 */
	private void assignCategoryIds(List<QuestionImportView> views, List<String> categoryNames,
	                               long userId, CategoryIndex index) {
		Map<String, Long> resolved = new HashMap<>();
		for (int i = 0; i < views.size(); i++) {
			String categoryName = categoryNames.get(i);
			Long categoryId = resolved.get(categoryName);
			if (categoryId == null) {
				categoryId = resolveCategoryId(categoryName, userId, index);
				resolved.put(categoryName, categoryId);
			}
			views.get(i).setCategoryId(categoryId);
		}
	}
	
	/**
	 * 一次查出该用户全部分类建索引，把「每级查一次库」降到「整批查一次」。
	 */
	private CategoryIndex loadCategoryIndex(long userId) {
		var t = QuestionsCategoriesTable.$;
		List<QuestionsCategories> all = sqlClient.createQuery(t)
				                                .where(t.userId().eq(userId))
				                                .select(t.fetch(QuestionsCategoriesFetcher.$.parentId().name()))
				                                .execute();
		
		Map<String, Long> byPath = new HashMap<>();
		Map<Long, Integer> childCount = new HashMap<>();
		for (QuestionsCategories category : all) {
			byPath.put(categoryKey(category.parentId(), category.name()), category.id());
			childCount.merge(category.parentId(), 1, Integer::sum);
		}
		return new CategoryIndex(byPath, childCount);
	}
	
	/**
	 * 「数学/算数」→ 逐级查找，没有就建，返回叶子分类 id。
	 * <p>
	 * 建分类的写法与 {@code QuestionCategoryController.addCategory} 保持一致：
	 * {@code SaveMode.INSERT_ONLY} + owner 由服务端注入（DTO 里没有 userId，客户端无法伪造）。
	 */
	private long resolveCategoryId(String categoryPath, long userId, CategoryIndex index) {
		List<String> segments = QuestionExcelListener.splitCategoryPath(categoryPath);
		if (segments.isEmpty()) {
			throw new BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST + " " + categoryPath);
		}
		
		long parentId = 0L;
		long currentId = 0L;
		for (String name : segments) {
			String key = categoryKey(parentId, name);
			Long categoryId = index.byPath().get(key);
			if (categoryId == null) {
				// sort 取同级现有数量，保证新分类排在同级末尾
				int sort = index.childCount().getOrDefault(parentId, 0);
				var input = new QuestionsCategorySaveInput.Builder()
						            .name(name)
						            .parentId(parentId)
						            .sort(sort)
						            .build();
				categoryId = categoriesRepository.save(
								QuestionsCategoriesDraft.$.produce(input.toEntity(), d -> d.setUserId(userId)),
								SaveMode.INSERT_ONLY)
						             .id();
				// 写回索引：同一批里再出现同名路径不会重复建
				index.byPath().put(key, categoryId);
				index.childCount().merge(parentId, 1, Integer::sum);
			}
			currentId = categoryId;
			parentId = categoryId;
		}
		return currentId;
	}
	
	public List<QuestionGenerateDto> generateQuestions(QuestionGenerateReq req) {
		var ct = QuestionsCategoriesTable.$;
		// 2026-09-17：本接口已放开给所有登录用户 → 分类必须是自己建的，
		// 否则普通用户能借别人的分类名去调大模型（下面 user_id 条件使 categoryDb 为 null）
		String categoryDb = sqlClient.createQuery(ct)
				                    .where(ct.id().eq(req.categoryId()))
				                    .where(ct.userId().eq(StpUtil.getLoginIdAsLong()))
				                    .select(ct.name())
				                    .fetchFirstOrNull();
		
		if (categoryDb == null) {
			throw new BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST);
		}
		
		return questionGenerateService.generateQuestions(
				categoryDb,
				req.count(),
				req.difficulty(),
				req.types(),
				req.includeMultiple()
		);
	}
	
	private QuestionImportInput convertImportViewToInput(QuestionImportView view) {
		var input = new QuestionImportInput.Builder()
				            .title(view.getTitle())
				            .type(view.getType())
				            .categoryId(view.getCategoryId())
				            .difficulty(view.getDifficulty())
				            .score(view.getScore())
				            .analysis(view.getAnalysis())
				            .answer(view.getAnswer());
		if (view.getChoices() != null) {
			List<QuestionImportInput.TargetOf_choices> choices = new ArrayList<>();
			for (QuestionImportView.TargetOf_choices vChoice : view.getChoices()) {
				QuestionImportInput.TargetOf_choices choice = new QuestionImportInput.TargetOf_choices();
				choice.setContent(vChoice.getContent());
				choice.setCorrect(vChoice.getCorrect());
				choice.setSort(vChoice.getSort());
				choices.add(choice);
			}
			input.choices(choices);
		}
		return input.build();
	}
	
	/**
	 * 模板里的示例行。覆盖 4 种题型 + 中文难度 + 留空默认值，用户照抄格式即可。
	 * 正式导入前删掉这些示例行。
	 */
	private List<QuestionExcelTemplateBo> createTemplateRows() {
		List<QuestionExcelTemplateBo> rows = new ArrayList<>();
		
		// 单选：填了选项 + 答案 1 个字母
		rows.add(QuestionExcelTemplateBo.builder()
				         .content("1+1=?")
				         .choiceA("1")
				         .choiceB("2")
				         .choiceC("3")
				         .choiceD("4")
				         .answer("B")
				         .categoryName("数学/算数")
				         .difficulty("容易")
				         .score("5")
				         .analysis("解析略")
				         .build());
		
		// 多选：答案连写 ABC，写 A,B,C 也一样
		rows.add(QuestionExcelTemplateBo.builder()
				         .content("下列哪些是编程语言？")
				         .choiceA("Java")
				         .choiceB("Python")
				         .choiceC("HTTP")
				         .choiceD("Go")
				         .answer("ABC")
				         .categoryName("计算机/基础")
				         .difficulty("中等")
				         .score("5")
				         .analysis("HTTP 是应用层协议，不是编程语言。")
				         .build());
		
		// 判断题：不填选项，答案填 对 / 错
		rows.add(QuestionExcelTemplateBo.builder()
				         .content("Java 是面向对象的语言。")
				         .answer("对")
				         .categoryName("计算机/基础")
				         .difficulty("容易")
				         .score("2")
				         .analysis("Java 支持封装、继承和多态。")
				         .build());
		
		// 简答题：不填选项，答案填参考答案；难度和分值留空 → 默认中等 / 1 分
		rows.add(QuestionExcelTemplateBo.builder()
				         .content("请简述封装的含义。")
				         .answer("把数据和对数据的操作捆绑在一起，并对外隐藏实现细节。")
				         .categoryName("计算机/基础")
				         .build());
		
		return rows;
	}
	
	/**
	 * (parentId, name) → 分类 id 的内存索引，外加每个父节点下的子分类数（用来算 sort）。
	 */
	private record CategoryIndex(Map<String, Long> byPath, Map<Long, Integer> childCount) {
	}
}
