package com.yyjy.exam.paper.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yyjy.exam.common.convention.result.PageRes;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.dto.PaperExamSettingsInput;
import com.yyjy.exam.entity.paper.dto.PaperSaveInput;
import com.yyjy.exam.entity.paper.entity.Paper;
import com.yyjy.exam.entity.paper.entity.PaperCategoriesFetcher;
import com.yyjy.exam.entity.paper.entity.PaperExamSettingsFetcher;
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
	 * <p>
	 * **存在则更新、不存在则新增**（upsert）。取代原 `PUT /paper/{id}/config`；
	 * 试卷的名称/描述/分类/参与方式改走 `POST /paper/save`。
	 * <p>
	 * ⚠️ 建卷不再预写设置行，发布前必须先调过这个接口（见 `POST /paper/{id}/publish` 的前置检查）。
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
	 * 保存试卷（**新增 / 更新合一**）：入参带 id = 更新该卷，不带 id = 新增。
	 * <p>
	 * 只收 4 个基本字段（名称 / 描述 / 分类 / 参与方式）；时长、起止时间、次数上限、及格分
	 * 与 8 项开关在 1:1 的 `paper_exam_settings` 里，由
	 * {@code POST /paper/{id}/exam-settings} 维护（不存在则新增、存在则更新）。
	 * <p>
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
