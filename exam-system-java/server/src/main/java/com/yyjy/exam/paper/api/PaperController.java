package com.yyjy.exam.paper.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yyjy.exam.common.convention.result.PageRes;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.paper.dto.*;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperCategoriesFetcher;
import com.yyjy.exam.entity.paper.entity.PaperExamSettingsFetcher;
import com.yyjy.exam.entity.paper.entity.PaperFetcher;
import com.yyjy.exam.entity.paper.io.req.PaperListQuery;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionAddReq;
import com.yyjy.exam.entity.paper.io.req.PaperQuestionsUpdateReq;
import com.yyjy.exam.entity.paper.io.req.PaperReportListQuery;
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
					.totalScore()
					.questionCount()
					.scoreCount()
					.examSettings(PaperExamSettingsFetcher.$
							              .duration()
							              .start()
							              .end()
							              .maxAttempts())
					.createTime();
	
	private final PaperService paperService;
	
	
	/**
	 * 写入考试设置（只含设置本身，不含题目）：时长 / 起止时间 / 次数上限 / 及格分 + 8 项开关。
	 * 试卷发布前必须先调过这个接口（见 `POST /paper/{id}/publish` 的前置检查）。
	 */
	@PostMapping("/{id}/exam-settings")
	public R<Void> updatePaperExamSettings(@PathVariable int id, @RequestBody @Valid PaperExamSettingsInput input) {
		paperService.updatePaperExamSettings(id, input);
		
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
	 * 试卷考试报表（**控制台**）：每张卷 + 交卷数 / 未评卷数 / 已评卷数。
	 * <p>
	 * 与 {@code GET /paper/list} 的区别：返回值换成报表行（`PaperReportView`，含三个统计列，不再是 `Paper` 实体），
	 * 筛选多了**考试开始 / 结束时间**——而且是两个独立区间。分页返回 `PageRes`（不套 `R`，与 `/paper/list` 一致）。
	 * <p>
	 * 查询参数 `PaperReportListQuery`：`name`(模糊) / `categoryId` / `startFrom` / `startTo` /
	 * `endFrom` / `endTo` / `page` / `size`，筛选都可空；`page` / `size` 必填（缺参 / 越界 → 422）。
	 * 时间走 ISO-8601（`2026-10-01T00:00:00`）。
	 */
	@GetMapping("/report/list")
	public PageRes<PaperReportView> listPaperReports(@Validated PaperReportListQuery query) {
		return paperService.listPaperReports(query);
	}
	
	/**
	 * 保存试卷（**新增 / 更新合一**）：入参带 id = 更新该卷，不带 id = 新增。
	 * 返回试卷 id（新增返回新 id，更新返回原 id）。
	 */
	@PostMapping("/save")
	public R<Long> savePaperV2(@Validated @RequestBody PaperSaveInput paper) {
		return R.ok(paperService.savePaper(paper));
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
