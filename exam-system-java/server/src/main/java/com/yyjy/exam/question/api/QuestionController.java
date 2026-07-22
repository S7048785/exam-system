package com.yyjy.exam.question.api;

import cn.dev33.satoken.annotation.SaCheckRole;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.question.dto.*;
import com.yyjy.exam.entity.question.entity.Questions;
import com.yyjy.exam.entity.question.io.req.*;
import com.yyjy.exam.entity.question.io.res.QuestionGenerateDto;
import com.yyjy.exam.entity.question.io.res.QuestionPageRes;
import com.yyjy.exam.question.service.QuestionService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.meta.Api;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@SaCheckRole("admin")
@Api
@RestController
@RequiredArgsConstructor
@RequestMapping("/question")
public class QuestionController {
	
	private final QuestionService questionService;
	
	/**
	 * 新增题目
	 */
	@Api
	@PostMapping("/add")
	public R<Questions> addQuestion(@RequestBody @Valid QuestionSaveRequest question) {
		return R.ok(questionService.save(question));
	}
	
	/**
	 * 更新题目
	 */
	@Api
	@PutMapping("/update")
	public R<Questions> updateQuestion(@RequestBody QuestionUpdateInput question) {
		return R.ok(questionService.update(question));
	}
	
	/**
	 * 删除题目
	 */
	@Api
	@DeleteMapping("/remove/{id}")
	public R<Void> removeQuestion(@PathVariable long id) {
		questionService.remove(id);
		return R.ok();
	}
	
	/**
	 * 获取题目详情
	 */
	@Api
	@GetMapping("/{id}")
	public R<QuestionsPageView> getQuestion(@PathVariable long id) {
		return R.ok(questionService.getById(id));
	}
	
	/**
	 * 获取题目列表
	 */
	@Api
	@GetMapping("/list")
	public R<QuestionPageRes> listQuestions(@Validated QuestionListReq req) {
		
		return R.ok(questionService.list(req));
	}
	
	/**
	 * 获取热门题目 获取访问次数最多的热门题目，用于首页推荐展示
	 */
	@Api
	@GetMapping("/popular")
	public R<List<QuestionsPageView>> getPopularQuestions(
			@RequestParam(defaultValue = "10") int size
	) {
		return R.ok(questionService.getPopularQuestions(size));
	}
	
	/**
	 * 热门题目缓存初始化、数据重置
	 */
	@Api
	@PostMapping("/popular/refresh")
	public R<Void> refreshQuestions() {
		questionService.refreshPopularQuestions();
		return R.ok();
	}
	
	/**
	 * 下载Excel导入模板
	 */
	@Api
	@GetMapping("/batch/template")
	public void downloadTemplate(HttpServletResponse response) {
		questionService.exportTemplate(response);
	}
	
	/**
	 * 预览Excel文件内容
	 */
	@Api
	@PostMapping("/batch/preview-excel")
	public R<List<QuestionImportView>> previewExcel(@RequestPart("file") MultipartFile file) {
		return R.ok(questionService.parseExcel(file));
	}
	
	/**
	 * AI智能生成题目
	 */
	@Api
	@PostMapping("/batch/ai-generate")
	public R<List<QuestionGenerateDto>> aiGenerate(@RequestBody QuestionGenerateReq req) {
		return R.ok(questionService.generateQuestions(req));
	}
	
	/**
	 * 批量导入题目
	 */
	@Api
	@PostMapping("/batch/import-questions")
	public R<String> importQuestions(@RequestBody List<QuestionImportInput> questions) {
		return R.ok(questionService.importBatch(questions));
	}
	
	/**
	 * Excel批量导入题目
	 */
	@Api
	@PostMapping("/batch/excel-import-questions")
	public R<String> importExcelQuestions(@RequestPart("file") MultipartFile file) {
		return R.ok(questionService.importBatchExcel(file));
	}
}
