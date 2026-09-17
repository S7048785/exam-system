package com.yyjy.exam.paper.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.dto.PaperListQuery;
import com.yyjy.exam.entity.paper.dto.PaperSaveInput;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperCategoriesFetcher;
import com.yyjy.exam.entity.paper.entity.PaperFetcher;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionAddReq;
import com.yyjy.exam.entity.paper.io.req.PaperUpdateInput;
import com.yyjy.exam.paper.service.PaperService;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 多用户改造：类级注解 @SaCheckRole("admin") → @SaCheckLogin。
 * 试卷按 owner 隔离，归属校验收口在 PaperService.requireOwnedPaper（无 admin 后门）。
 * <p>
 * 两条读路径的语义**必须分开**（Q26=A 的直接代价）：
 * <ul>
 *   <li>{@code GET /paper/list} —— 「我的试卷」，强制按 `user_id` 过滤，含未发布草稿</li>
 *   <li>{@code GET /paper/square} —— 公开广场，强制 `is_published = 1`，**不限 `user_id`**</li>
 * </ul>
 * 靠一个接口 + query 参数糊在一起，迟早出现「漏加 owner 条件 → 用户看到别人的全部草稿」。
 */
@SaCheckLogin
@RestController
@RequestMapping("/paper")
@RequiredArgsConstructor
public class PaperController {
	
	public static final Fetcher<Paper> PAPER_ITEM =
			PaperFetcher.$
					.name()
					.description()
					.category(PaperCategoriesFetcher.$.name())
					.published()
					.participateMode()
					.maxAttempts()
					.totalScore()
					.questionCount()
					.duration()
					.start()
					.end()
					.createTime();
	
	private final PaperService paperService;
	
	
	/**
	 * 更新试卷
	 */
	@PutMapping("/update")
	public R<Void> updatePaper(@RequestBody PaperUpdateInput paper) {
		paperService.updatePaper(paper);
		return R.ok();
	}
	
	/**
	 * 删除试卷
	 */
	@DeleteMapping("/remove/{id}")
	public R<Void> removePaper(@PathVariable int id) {
		paperService.removePaper(id);
		return R.ok();
	}
	
	/**
	 * 获取试卷详情
	 */
	@GetMapping("/{id}")
	public R<PaperDetail> getPaper(@PathVariable int id) {
		return R.ok(paperService.getPaper(id));
	}
	
	/**
	 * 获取试卷列表（**我的**，含未发布草稿）
	 */
	@GetMapping("/list")
	public R<List<@FetchBy("PAPER_ITEM") Paper>> listPapers(PaperListQuery query) {
		
		return R.ok(paperService.listPapersByNameAndStatus(query, PAPER_ITEM));
	}
	
	/**
	 * 公开广场：已发布的试卷，**不限 `user_id`**
	 * <p>复用 {@link #PAPER_ITEM} —— 它的字段已核实安全（name / description / category.name /
	 * published / totalScore / questionCount / duration / start / end / createTime），
	 * 不含任何题目、选项或答案。</p>
	 */
	@GetMapping("/square")
	public R<List<@FetchBy("PAPER_ITEM") Paper>> listSquarePapers(PaperListQuery query) {
		
		return R.ok(paperService.listPublishedPapers(query, PAPER_ITEM));
	}
	
	/**
	 * 新增试卷 v2（不含题目，返回试卷ID）
	 */
	@PostMapping("/v2/add")
	public R<Integer> addPaperV2(@RequestBody PaperSaveInput paper) {
		int id = paperService.addPaper(paper);
		return R.ok(id);
	}
	
	/**
	 * 发布试卷（PUBLISHED false -> true）
	 */
	@PostMapping("/{id}/publish")
	public R<Void> publishPaper(@PathVariable int id) {
		paperService.publishPaper(id);
		return R.ok();
	}
	
	/**
	 * 获取试卷题目列表
	 */
	@GetMapping("/{id}/questions")
	public R<List<PaperDetail.TargetOf_questions>> getPaperQuestions(@PathVariable int id) {
		return R.ok(paperService.getPaperQuestions(id));
	}
	
	/**
	 * 批量添加试卷题目（upsert）
	 */
	@PostMapping("/{id}/questions")
	public R<Void> addPaperQuestions(@PathVariable int id, @RequestBody PaperQuestionAddReq input) {
		paperService.addPaperQuestions(id, input);
		return R.ok();
	}
	
	/**
	 * 删除试卷中的一道题目
	 */
	@DeleteMapping("/{id}/questions/{questionId}")
	public R<Void> removePaperQuestion(@PathVariable int id, @PathVariable long questionId) {
		paperService.removePaperQuestion(id, questionId);
		return R.ok();
	}
	
	/**
	 * 更新试卷中题目的分数
	 */
	@PutMapping("/{id}/questions/{questionId}/score")
	public R<Void> updatePaperQuestionScore(
			@PathVariable int id,
			@PathVariable long questionId,
			@RequestParam int score
	) {
		paperService.updatePaperQuestionScore(id, questionId, score);
		return R.ok();
	}
	
	/**
	 * AI智能组卷
	 */
	@PostMapping("/ai")
	public R<Paper> aiPaper(@RequestBody PaperAiSaveDto dto) {
		return R.ok(paperService.aiCreatePaper(dto));
	}
}
