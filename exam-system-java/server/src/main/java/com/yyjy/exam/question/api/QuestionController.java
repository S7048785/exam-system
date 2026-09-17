package com.yyjy.exam.question.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.question.dto.QuestionImportInput;
import com.yyjy.exam.entity.question.dto.QuestionImportView;
import com.yyjy.exam.entity.question.dto.QuestionUpdateInput;
import com.yyjy.exam.entity.question.dto.QuestionsPageView;
import com.yyjy.exam.entity.question.entity.Questions;
import com.yyjy.exam.entity.question.io.req.QuestionGenerateReq;
import com.yyjy.exam.entity.question.io.req.QuestionListReq;
import com.yyjy.exam.entity.question.io.req.QuestionSaveReq;
import com.yyjy.exam.entity.question.io.res.QuestionGenerateDto;
import com.yyjy.exam.entity.question.io.res.QuestionPageRes;
import com.yyjy.exam.question.service.QuestionService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 多用户改造：类级 @SaCheckRole("admin") → @SaCheckLogin，题目按 owner 隔离，
 * 归属校验收口在 QuestionService.requireOwnedQuestion（无 admin 后门）。
 * <p>
 * 2026-09-17 调整：
 * <ul>
 *   <li>{@code GET /question/popular} 与 {@code POST /question/popular/refresh} 已**删除**
 *       —— 数据源是全局 Redis ZSet，返回的 QuestionsPageView 含 correct 与 answer，
 *       与「题目按 `user_id` 隔离」的方向冲突；前端对这两个接口零调用。</li>
 *   <li>{@code POST /question/batch/ai-generate} 已**去掉 admin 限制**，登录即可调用。</li>
 * </ul>
 */
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
	@PutMapping("/update")
	public R<Questions> updateQuestion(@RequestBody QuestionUpdateInput question) {
		return R.ok(questionService.update(question));
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
	 * 预览Excel文件内容
	 */
	@PostMapping("/batch/preview-excel")
	public R<List<QuestionImportView>> previewExcel(@RequestPart("file") MultipartFile file) {
		return R.ok(questionService.parseExcel(file));
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
	public R<String> importQuestions(@RequestBody List<QuestionImportInput> questions) {
		return R.ok(questionService.importBatch(questions));
	}
	
	/**
	 * Excel批量导入题目
	 */
	@PostMapping("/batch/excel-import-questions")
	public R<String> importExcelQuestions(@RequestPart("file") MultipartFile file) {
		return R.ok(questionService.importBatchExcel(file));
	}
}
