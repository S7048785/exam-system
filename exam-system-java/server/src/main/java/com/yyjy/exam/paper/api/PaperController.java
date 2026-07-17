package com.yyjy.exam.paper.api;

import cn.dev33.satoken.annotation.SaCheckRole;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperFetcher;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionAddReq;
import com.yyjy.exam.entity.paper.io.req.PaperSaveInput;
import com.yyjy.exam.entity.paper.io.req.PaperSaveV2Input;
import com.yyjy.exam.entity.paper.io.req.PaperUpdateInput;
import com.yyjy.exam.paper.service.PaperService;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.client.meta.Api;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SaCheckRole("admin")
@Api
@RestController
@RequestMapping("/paper")
@RequiredArgsConstructor
public class PaperController {
	
	public static final Fetcher<Paper> PAPER_ITEM =
			PaperFetcher.$
					.name()
					.description()
					.categoryId()
					.published()
					.totalScore()
					.questionCount()
					.duration()
					.start()
					.end()
					.createTime();
	
	private final PaperService paperService;
	
	/**
	 * 新增试卷
	 */
	@Api
	@PostMapping("/add")
	public R<Void> addPaper(@RequestBody PaperSaveInput paper) {
		paperService.addPaper(paper);
		return R.ok();
	}
	
	/**
	 * 更新试卷
	 */
	@Api
	@PutMapping("/update")
	public R<Void> updatePaper(@RequestBody PaperUpdateInput paper) {
		paperService.updatePaper(paper);
		return R.ok();
	}
	
	/**
	 * 删除试卷
	 */
	@Api
	@DeleteMapping("/remove/{id}")
	public R<Void> removePaper(@PathVariable int id) {
		paperService.removePaper(id);
		return R.ok();
	}
	
	/**
	 * 获取试卷详情
	 */
	@Api
	@GetMapping("/{id}")
	public R<PaperDetail> getPaper(@PathVariable int id) {
		return R.ok(paperService.getPaper(id));
	}
	
	/**
	 * 获取试卷列表
	 */
	@Api
	@GetMapping("/list")
	public R<List<@FetchBy("PAPER_ITEM") Paper>> listPapers(
			@RequestParam(name = "name", required = false) String name,
			@RequestParam(name = "ongoing", required = false) Boolean ongoing,
			@RequestParam(name = "page", defaultValue = "1") int page,
			@RequestParam(name = "size", defaultValue = "10") int size
	) {
		return R.ok(paperService.listPapersByNameAndStatus(name, ongoing, page, size, PAPER_ITEM));
	}
	
	/**
	 * 新增试卷 v2（不含题目，返回试卷ID）
	 */
	@Api
	@PostMapping("/v2/add")
	public R<Integer> addPaperV2(@RequestBody PaperSaveV2Input paper) {
		int id = paperService.addPaperV2(paper);
		return R.ok(id);
	}
	
	/**
	 * 发布试卷（PUBLISHED false -> true）
	 */
	@Api
	@PostMapping("/{id}/publish")
	public R<Void> publishPaper(@PathVariable int id) {
		paperService.publishPaper(id);
		return R.ok();
	}
	
	/**
	 * 获取试卷题目列表
	 */
	@Api
	@GetMapping("/{id}/questions")
	public R<List<PaperDetail.TargetOf_questions>> getPaperQuestions(@PathVariable int id) {
		return R.ok(paperService.getPaperQuestions(id));
	}
	
	/**
	 * 批量添加试卷题目（upsert）
	 */
	@Api
	@PostMapping("/{id}/questions")
	public R<Void> addPaperQuestions(@PathVariable int id, @RequestBody PaperQuestionAddReq input) {
		paperService.addPaperQuestions(id, input);
		return R.ok();
	}
	
	/**
	 * 删除试卷中的一道题目
	 */
	@Api
	@DeleteMapping("/{id}/questions/{questionId}")
	public R<Void> removePaperQuestion(@PathVariable int id, @PathVariable long questionId) {
		paperService.removePaperQuestion(id, questionId);
		return R.ok();
	}
	
	/**
	 * 更新试卷中题目的分数
	 */
	@Api
	@PutMapping("/{id}/questions/{questionId}/score")
	public R<Void> updatePaperQuestionScore(
			@PathVariable int id,
			@PathVariable long questionId,
			@RequestParam double score
	) {
		paperService.updatePaperQuestionScore(id, questionId, score);
		return R.ok();
	}
	
	/**
	 * AI智能组卷
	 */
	@Api
	@PostMapping("/ai")
	public R<Paper> aiPaper(@RequestBody PaperAiSaveDto dto) {
		return R.ok(paperService.aiCreatePaper(dto));
	}
}
