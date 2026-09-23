package com.yyjy.exam.paper.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yyjy.exam.common.convention.result.PageRes;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperConfigInput;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperCategoriesFetcher;
import com.yyjy.exam.entity.paper.entity.PaperFetcher;
import com.yyjy.exam.entity.paper.io.req.PaperListQuery;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionAddReq;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionsUpdateReq;
import com.yyjy.exam.paper.service.PaperService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.FetchBy;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
	 * 更新试卷配置（不含题目）
	 */
	@PutMapping("/{id}/config")
	public R<Void> updatePaperConfig(@PathVariable int id, @RequestBody @Valid PaperConfigInput input) {
		paperService.updatePaperConfig(id, input);
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
	public PageRes<@FetchBy("PAPER_ITEM") Paper> listPapers(@Validated PaperListQuery query) {
		return paperService.listPapersByNameAndStatus(query, PAPER_ITEM);
	}
	
	/**
	 * 新增试卷 v2（不含题目，返回试卷ID）
	 */
	@PostMapping("/add")
	public R<Integer> addPaperV2(@Validated @RequestBody PaperConfigInput paper) {
		int id = paperService.addPaper(paper);
		return R.ok(id);
	}
	
	/**
	 * 发布试卷（is_published false -> true）
	 */
	@PostMapping("/{id}/publish")
	public R<Void> publishPaper(@PathVariable int id) {
		paperService.publishPaper(id);
		return R.ok();
	}
	
	/**
	 * 撤回发布（is_published true -> false），回到草稿态。
	 * <p>
	 * ⚠️ 会**物理删除**该卷的全部考试记录与作答明细，不可恢复。
	 */
	@PostMapping("/{id}/unpublish")
	public R<Void> unpublishPaper(@PathVariable int id) {
		paperService.unpublishPaper(id);
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
	 * 整体替换试卷题目集（原 `PUT /paper/update` 的「题目」那半）
	 */
	@PutMapping("/{id}/questions")
	public R<Void> replacePaperQuestions(@PathVariable int id, @RequestBody @Validated PaperQuestionsUpdateReq input) {
		paperService.replacePaperQuestions(id, input);
		return R.ok();
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
	@DeleteMapping("/{id}/question/{questionId}")
	public R<Void> removePaperQuestion(@PathVariable int id, @PathVariable long questionId) {
		paperService.removePaperQuestion(id, questionId);
		return R.ok();
	}
	
	/**
	 * 更新试卷中题目的分数
	 */
	@PutMapping("/{id}/question/{questionId}/score")
	public R<Void> updatePaperQuestionScore(
			@PathVariable int id,
			@PathVariable long questionId,
			@RequestParam @Min(1) int score
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
