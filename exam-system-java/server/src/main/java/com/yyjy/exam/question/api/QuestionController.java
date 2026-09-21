package com.yyjy.exam.question.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.question.dto.QuestionImportInput;
import com.yyjy.exam.entity.question.dto.QuestionsPageView;
import com.yyjy.exam.entity.question.entity.Questions;
import com.yyjy.exam.entity.question.io.req.QuestionGenerateReq;
import com.yyjy.exam.entity.question.io.req.QuestionListReq;
import com.yyjy.exam.entity.question.io.req.QuestionSaveReq;
import com.yyjy.exam.entity.question.io.res.QuestionGenerateDto;
import com.yyjy.exam.entity.question.io.res.QuestionPageRes;
import com.yyjy.exam.question.bo.QuestionImportResult;
import com.yyjy.exam.question.service.QuestionService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@SaCheckLogin
@RestController
@RequiredArgsConstructor
@RequestMapping("/question")
public class QuestionController {
	
	private final QuestionService questionService;
	
	/**
	 * 新增题目
	 */
	@PostMapping("/add")
	public R<Questions> addQuestion(@RequestBody @Valid QuestionSaveReq question) {
		return R.ok(questionService.save(question));
	}
	
	/**
	 * 更新题目
	 */
	@PutMapping("/update/{id}")
	public R<Questions> updateQuestion(@PathVariable long id, @RequestBody @Valid QuestionSaveReq question) {
		return R.ok(questionService.update(id, question));
	}
	
	/**
	 * 删除题目
	 */
	@DeleteMapping("/remove/{id}")
	public R<Void> removeQuestion(@PathVariable long id) {
		questionService.remove(id);
		return R.ok();
	}
	
	/**
	 * 获取题目详情
	 */
	@GetMapping("/{id}")
	public R<QuestionsPageView> getQuestion(@PathVariable long id) {
		return R.ok(questionService.getById(id));
	}
	
	/**
	 * 获取题目列表
	 */
	@GetMapping("/list")
	public R<QuestionPageRes> listQuestions(@Validated QuestionListReq req) {
		
		return R.ok(questionService.list(req));
	}
	
	/**
	 * 下载Excel导入模板
	 */
	@GetMapping("/batch/template")
	public void downloadTemplate(HttpServletResponse response) {
		questionService.exportTemplate(response);
	}
	
	/**
	 * AI智能生成题目
	 * <p>2026-09-17 起登录即可调用（原为 admin 专属）。
	 * ⚠️ 注意：这里会**真实调用大模型产生费用**，成本控制口径（Q12）尚未确定。</p>
	 */
	@PostMapping("/batch/ai-generate")
	public R<List<QuestionGenerateDto>> aiGenerate(@RequestBody QuestionGenerateReq req) {
		return R.ok(questionService.generateQuestions(req));
	}
	
	/**
	 * 批量导入题目
	 */
	@PostMapping("/batch/import-questions")
	public R<QuestionImportResult> importQuestions(@RequestBody List<QuestionImportInput> questions) {
		return R.ok(questionService.importBatch(questions));
	}
	
	/**
	 * Excel 批量导入（唯一入口）：一次上传即完成「解析 → 分类解析 → 入库」，返回逐行报告。
	 * <p>批量导入的正确语义是「能导的导、导不了的说明原因」：填错的行会被跳过，报告里给出
	 * 「第几行、错在哪」，其余行照常入库，而不是一行有问题就把整份文件丢掉。</p>
	 */
	@PostMapping("/batch/excel-import-questions")
	public R<QuestionImportResult> importExcelQuestions(@RequestPart("file") MultipartFile file) {
		return R.ok(questionService.importFromExcel(file));
	}
}
