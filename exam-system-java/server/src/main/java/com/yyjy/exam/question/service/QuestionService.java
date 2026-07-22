package com.yyjy.exam.question.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.write.style.column.LongestMatchColumnWidthStyleStrategy;
import com.yyjy.exam.common.constant.CacheConstant;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.common.util.RedisUtil;
import com.yyjy.exam.entity.question.dto.*;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.entity.question.entity.Questions;
import com.yyjy.exam.entity.question.entity.QuestionsCategoriesTable;
import com.yyjy.exam.entity.question.entity.QuestionsTable;
import com.yyjy.exam.entity.question.io.req.*;
import com.yyjy.exam.entity.question.io.res.QuestionGenerateDto;
import com.yyjy.exam.entity.question.io.res.QuestionPageRes;
import com.yyjy.exam.question.bo.QuestionExcelTemplateBo;
import com.yyjy.exam.question.common.QuestionExcelListener;
import com.yyjy.exam.question.repository.QuestionChoicesRepository;
import com.yyjy.exam.question.repository.QuestionsRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.data.redis.core.DefaultTypedTuple;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {
	
	private final QuestionsRepository questionsRepository;
	private final QuestionChoicesRepository questionChoicesRepository;
	private final RedisUtil redisUtil;
	private final QuestionImportService questionImportService;
	private final QuestionGenerateService questionGenerateService;
	private final JSqlClient sqlClient;
	
	@Transactional
	public Questions save(QuestionSaveReq req) {
		if (questionsRepository.existsByTypeAndTitle(req.getType(), req.getTitle())) {
			throw new BusinessException(MessageConstant.QUESTION_EXIST);
		}
		
		if (!questionsRepository.existsById(req.getCategoryId())) {
			throw new BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST);
		}
		
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
		
		return questionsRepository.save(builder.build(), SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND);
	}
	
	private void processChoice(QuestionSaveInput.Builder builder, List<ChoiceDto> choiceDtos, boolean allowMultiple) {
		if (choiceDtos == null || choiceDtos.isEmpty()) {
			throw new BusinessException(MessageConstant.QUESTION_CHOICE_CHOICES_NOT_EMPTY);
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
	public Questions update(QuestionUpdateInput question) {
		if (!questionsRepository.existsById(question.getCategoryId())) {
			throw new BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST);
		}
		// 查询题目是否存在
		Questions oldQuestion = questionsRepository.findById(question.getId())
				                        .orElseThrow(() -> new BusinessException(MessageConstant.QUESTION_NOT_EXIST));
		
		// 查询同类型下是否有同名题目
		if (questionsRepository.existsByTypeAndTitle(oldQuestion.type(), question.getTitle())) {
			throw new BusinessException(MessageConstant.QUESTION_EXIST);
		}
		
		// 若是单选或多选题，则删除旧题目选项
		if (QuestionType.SINGLE_CHOICE.equals(oldQuestion.type()) ||
				    QuestionType.MULTIPLE_CHOICE.equals(oldQuestion.type())) {
			questionChoicesRepository.deleteByQuestionId(question.getId());
		}
		
		return questionsRepository.save(question, SaveMode.UPDATE_ONLY);
	}
	
	public void remove(long id) {
		questionsRepository.deleteById(id);
	}
	
	public QuestionsPageView getById(long id) {
		QuestionsPageView question = questionsRepository.sql().getEntities().findById(QuestionsPageView.class, id);
		Optional.ofNullable(question).orElseThrow(() -> new BusinessException(MessageConstant.QUESTION_NOT_EXIST));
		
		CompletableFuture.runAsync(() ->
				                           redisUtil.zIncrementScore(CacheConstant.POPULAR_QUESTIONS_KEY, String.valueOf(id), 1.0)
		);
		
		return question;
	}
	
	public QuestionPageRes list(QuestionListReq req) {
		int page = req.page() != null ? req.page() : 1;
		int size = req.size() != null && req.size() < 20 ? req.size() : 20;
		
		QuestionsTable t = QuestionsTable.$;
		var query = sqlClient.createQuery(t);
		
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
	
	public List<QuestionsPageView> getPopularQuestions(int size) {
		// 从Redis中获取热门题目ID
		Set<ZSetOperations.TypedTuple<String>> popularIdSet =
				redisUtil.zReverseRangeWithScores(CacheConstant.POPULAR_QUESTIONS_KEY, 0, size - 1);
		
		if (popularIdSet == null || popularIdSet.isEmpty()) {
			return questionsRepository.getLast(size);
		}
		
		// 从缓存中获取的题目ID列表
		List<Long> popularIdsList = popularIdSet.stream()
				                            .map(item -> item.getValue() != null ? Long.parseLong(item.getValue()) : null)
				                            .filter(Objects::nonNull)
				                            .toList();
		
		// 从数据库中获取的题目列表
		List<QuestionsPageView> popularQuestionList = new ArrayList<>();
		List<Long> newPopularIdsList = new ArrayList<>();
		
		for (Long questionId : popularIdsList) {
			QuestionsPageView view = questionsRepository.findQuestionsPageViewById(questionId);
			if (view != null) {
				newPopularIdsList.add(questionId);
				popularQuestionList.add(view);
			}
		}
		
		if (popularQuestionList.size() < size) {
			List<QuestionsPageView> notInQuestions = questionsRepository.getLastNotIn(
					size - popularQuestionList.size(), newPopularIdsList);
			popularQuestionList.addAll(notInQuestions);
		}
		
		return popularQuestionList;
	}
	
	/**
	 * 刷新热门题目缓存
	 */
	public void refreshPopularQuestions() {
		// 删除缓存
		redisUtil.delete(CacheConstant.POPULAR_QUESTIONS_KEY);
		// 查询所有题目id
		List<Long> questionIds = questionsRepository.findAllIds();
		// 存入缓存
		Set<ZSetOperations.TypedTuple<String>> tuples = questionIds.stream()
				                                                .map(id -> (ZSetOperations.TypedTuple<String>) new DefaultTypedTuple<>(String.valueOf(id), 0.0))
				                                                .collect(Collectors.toSet());
		redisUtil.zAdd(CacheConstant.POPULAR_QUESTIONS_KEY, tuples);
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
			
			// 生成模板文件
			EasyExcel.write(response.getOutputStream(), QuestionExcelTemplateBo.class)
					.registerWriteHandler(new LongestMatchColumnWidthStyleStrategy())
					.sheet("题目模板")
					.doWrite(List.of(createTemplateBo()));
		} catch (Exception e) {
			throw new BusinessException("导出模板失败");
		}
	}
	
	public List<QuestionImportView> parseExcel(MultipartFile file) {
		try {
			QuestionExcelListener listener = new QuestionExcelListener();
			EasyExcel.read(file.getInputStream(), QuestionExcelTemplateBo.class, listener).sheet().doRead();
			
			List<String> errors = listener.getErrors();
			if (!errors.isEmpty()) {
				throw new BusinessException("数据校验失败：\n" + String.join("\n", errors));
			}
			return listener.getDatas();
		} catch (BusinessException e) {
			throw e;
		} catch (Exception e) {
			throw new BusinessException("解析Excel失败");
		}
	}
	
	public String importBatch(List<QuestionImportInput> questions) {
		return questionImportService.importBatch(questions);
	}
	
	public String importBatchExcel(MultipartFile file) {
		if (file.isEmpty()) {
			throw new BusinessException(MessageConstant.FILE_NOT_EMPTY);
		}
		String filename = file.getOriginalFilename();
		if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
			throw new BusinessException(MessageConstant.FILE_FORMAT_ERROR);
		}
		List<QuestionImportView> views = parseExcel(file);
		List<QuestionImportInput> inputs = views.stream()
				                                   .map(this::convertImportViewToInput)
				                                   .toList();
		return questionImportService.importBatch(inputs);
	}
	
	public List<QuestionGenerateDto> generateQuestions(QuestionGenerateReq req) {
		var ct = QuestionsCategoriesTable.$;
		String categoryDb = sqlClient.createQuery(ct)
				                    .where(ct.id().eq(req.categoryId()))
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
	
	private QuestionExcelTemplateBo createTemplateBo() {
		return QuestionExcelTemplateBo.builder()
				       .content("以下哪个是Spring框架的核心特性?")
				       .type("CHOICE")
				       .multiple("否")
				       .categoryId("1")
				       .difficulty("MEDIUM")
				       .score("1")
				       .choiceA("依赖注入")
				       .choiceB("面向切面编程")
				       .choiceC("事务管理")
				       .choiceD("以上都是")
				       .answer("D")
				       .analysis("Spring框架的核心特性包括依赖注入、面向切面编程和事务管理等。")
				       .build();
		
	}
}
