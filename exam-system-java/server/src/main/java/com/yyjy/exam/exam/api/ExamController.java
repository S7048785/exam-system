package com.yyjy.exam.exam.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yyjy.exam.common.convention.result.PageRes;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.exam.dto.ExamRecordDetail;
import com.yyjy.exam.entity.exam.dto.ExamTakingView;
import com.yyjy.exam.entity.exam.io.req.*;
import com.yyjy.exam.entity.exam.io.res.*;
import com.yyjy.exam.exam.service.ExamGradingService;
import com.yyjy.exam.exam.service.ExamRecordQueryService;
import com.yyjy.exam.exam.service.ExamStartService;
import com.yyjy.exam.exam.service.ExamTakingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 考试相关接口
 * 统一前缀 /exams
 */
@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {
	
	private final ExamStartService examStartService;
	private final ExamTakingService examTakingService;
	private final ExamGradingService examGradingService;
	private final ExamRecordQueryService examRecordQueryService;
	
	/**
	 * 考试入口页信息（**考生侧，免登录可访问**）：试卷名、考试时间、描述、总分、参与方式。
	 * 未发布 → 422「考试不存在」；已结束 → 422「考试已结束」；未开始照常返回，由前端提示。
	 */
	@GetMapping("/paper/{id}")
	public R<ExamPaperInfoRes> getExamPaperInfo(@PathVariable int id) {
		return R.ok(examTakingService.getPaperInfoForExaminee(id));
	}
	
	/**
	 * 开考：返回考试记录 `publicId`（有没交卷的记录则直接返回那条，即「续考」）。
	 * `studentName` 只有**免登录考试**才需要传（1~50 个字符）；账号登录考试的姓名取账号里的
	 * `realName`，请求体里**不要传**（传空串会被 `@Size(min = 1)` 拦成 422，要么省略字段要么传 null）。
	 */
	@PostMapping("/start")
	public R<String> startExam(@RequestBody @Valid StartExamReq req) {
		return R.ok(examStartService.startExam(req.paperId(), req.studentName()));
	}
	
	/**
	 * 获取答题页数据（无正确答案，供考试中展示题目）
	 */
	@GetMapping("/{publicId}/taking")
	public R<ExamTakingView> getExamTaking(@PathVariable String publicId) {
		return R.ok(examTakingService.getExamTaking(publicId));
	}
	
	/**
	 * 获取考试详情（含答题记录、评分结果、阅卷批注）
	 */
	@GetMapping("/{publicId}/detail")
	public R<ExamRecordDetail> getExamDetail(@PathVariable String publicId) {
		return R.ok(examTakingService.getExamDetail(publicId));
	}
	
	/**
	 * 考试中手动保存答案（upsert，不改状态不触发评分）
	 */
	@PostMapping("/{publicId}/answers")
	public R<Void> saveAnswers(
			@PathVariable String publicId,
			@RequestBody List<SubmitAnswerReq> answers
	) {
		examTakingService.saveAnswers(publicId, answers);
		return R.ok();
	}
	
	/**
	 * 提交答案：
	 * 同步批改选择/判断题，简答题留待人工批改
	 */
	@PostMapping("/submit/{publicId}")
	public R<Void> submitAnswers(
			@PathVariable String publicId,
			@RequestBody List<SubmitAnswerReq> answers
	) {
		examTakingService.submitAnswers(publicId, answers);
		return R.ok();
	}
	
	/**
	 * 考试结果（**考生侧，免登录**）：凭 `publicId` 看成绩 / 用时 / 交卷时间 / 总分 / 及格分。
	 * <p>
	 * 只有 `GRADED` 才返回结果；`ONGOING`（还没交卷）与 `GRADING`（待人工批改）一律 422
	 * 「试卷未提交」；`publicId` 查不到 → 422「考试记录不存在」。
	 */
	@GetMapping("/result/{publicId}")
	public R<ExamResultRes> getExamResult(@PathVariable String publicId) {
		return R.ok(examTakingService.getExamResult(publicId));
	}
	
	/**
	 * 人工判卷（**批量**）：给这场考试的若干条答案打分（简答题用），
	 * 顺带重算该场考试的 `score` 并按「还有没有没判的答案」推进 `status`。
	 * <p>
	 * 状态前置校验：**只有待批改（`GRADING`）能判** —— 未交卷（`ONGOING`）与已判完（`GRADED`）
	 * 都会被拒（422）；得分上限 = 该题在这张卷上的配分，超了也是 422。
	 *
	 * @param publicId 考试记录对外短码（`exam_records.public_id`）
	 */
	@SaCheckLogin
	@PostMapping("/grade/{publicId}")
	public R<Void> gradeAnswers(
			@PathVariable String publicId,
			@RequestBody @Valid List<@Valid GradeAnswerReq> answers
	) {
		examGradingService.gradeAnswers(publicId, answers);
		return R.ok();
	}
	
	/**
	 * 获取当前用户的考试记录列表（只返回 `publicId`，不吐自增 id）
	 */
	@SaCheckLogin
	@GetMapping("/history")
	public R<List<ExamHistoryItemRes>> getExamHistory() {
		return R.ok(examTakingService.getExamHistory());
	}
	
	/**
	 * 成绩列表（**控制台**：试卷作者查看本卷全部考试记录，含排名 / 用时 / 及格分）。
	 */
	@SaCheckLogin
	@GetMapping("/records")
	public PageRes<ExamRecordListItemRes> listPaperRecords(@Validated ExamRecordListQuery query) {
		return examRecordQueryService.listPaperRecords(query);
	}
	
	/**
	 * 成绩统计（**控制台**：表格上方的汇总数字）。
	 */
	@SaCheckLogin
	@GetMapping("/records/stats")
	public R<ExamRecordStatsRes> getExamRecordStats(@Validated ExamRecordStatsQuery query) {
		return R.ok(examRecordQueryService.getRecordStats(query));
	}
	
	/**
	 * 考生的答题详情（**控制台**：「成绩」弹窗里点某一行看作答，**只读**）。
	 */
	@SaCheckLogin
	@GetMapping("/records/{publicId}/detail")
	public R<ExamRecordDetail> getRecordDetail(@PathVariable String publicId) {
		return R.ok(examRecordQueryService.getRecordDetailForAuthor(publicId));
	}
}
