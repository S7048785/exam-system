package com.yyjy.exam.exam.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yyjy.exam.common.convention.result.PageRes;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.Fetchers;
import com.yyjy.exam.entity.exam.dto.ExamRecordDetail;
import com.yyjy.exam.entity.exam.dto.ExamTakingView;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.io.req.ExamRecordListQuery;
import com.yyjy.exam.entity.exam.io.req.ExamRecordStatsQuery;
import com.yyjy.exam.entity.exam.io.req.GradeAnswerReq;
import com.yyjy.exam.entity.exam.io.req.StartExamReq;
import com.yyjy.exam.entity.exam.io.req.SubmitAnswerReq;
import com.yyjy.exam.entity.exam.io.res.ExamPaperInfoRes;
import com.yyjy.exam.entity.exam.io.res.ExamRecordListItemRes;
import com.yyjy.exam.entity.exam.io.res.ExamRecordStatsRes;
import com.yyjy.exam.exam.service.ExamGradingService;
import com.yyjy.exam.exam.service.ExamRecordQueryService;
import com.yyjy.exam.exam.service.ExamStartService;
import com.yyjy.exam.exam.service.ExamTakingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
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
	
	private final static Fetcher<ExamRecords> EXAM_RECORD_ITEM =
			Fetchers.EXAM_RECORDS_FETCHER
					.studentName()
					.score()
					.startTime()
					.endTime()
					.paper(Fetchers.PAPER_FETCHER
							       .totalScore()
							       .examSettings(Fetchers.PAPER_EXAM_SETTINGS_FETCHER.passingScore()));
	private final ExamStartService examStartService;
	private final ExamTakingService examTakingService;
	private final ExamGradingService examGradingService;
	private final ExamRecordQueryService examRecordQueryService;
	
	/**
	 * 考试入口页信息（**考生侧，免登录可访问**）：试卷名、考试时间、描述、总分、参与方式。
	 * <p>
	 * 未发布 → 422「考试不存在」；已结束 → 422「考试已结束」；未开始照常返回，由前端提示。
	 */
	@GetMapping("/paper/{id}")
	public R<ExamPaperInfoRes> getExamPaperInfo(@PathVariable int id) {
		return R.ok(examTakingService.getPaperInfoForExaminee(id));
	}
	
	/**
	 * 开考：返回考试记录 id（有没交卷的记录则直接返回那条，即「续考」）。
	 * <p>
	 * `studentName` 只有**免登录考试**才需要传（1~50 个字符）；账号登录考试的姓名取账号里的
	 * `realName`，请求体里**不要传**（传空串会被 `@Size(min = 1)` 拦成 422，要么省略字段要么传 null）。
	 */
	@PostMapping("/start")
	public R<String> startExam(@RequestBody @Valid StartExamReq req) {
		long examRecordId = examStartService.startExam(req.paperId(), req.studentName());
		// 雪花 id 有 19 位，超过 JS 的 Number.MAX_SAFE_INTEGER，按字符串返回才不会掉精度
		return R.ok(String.valueOf(examRecordId));
	}
	
	/**
	 * 获取答题页数据（无正确答案，供考试中展示题目）
	 */
	@GetMapping("/{id}/taking")
	public R<ExamTakingView> getExamTaking(@PathVariable String id) {
		return R.ok(examTakingService.getExamTaking(Long.parseLong(id)));
	}
	
	/**
	 * 获取考试详情（含答题记录、评分结果、阅卷批注）
	 */
	@GetMapping("/{id}/detail")
	public R<ExamRecordDetail> getExamDetail(@PathVariable String id) {
		return R.ok(examTakingService.getExamDetail(Long.parseLong(id)));
	}
	
	/**
	 * 考试中手动保存答案（upsert，不改状态不触发评分）
	 */
	@PostMapping("/{examRecordId}/answers")
	public R<Void> saveAnswers(
			@PathVariable String examRecordId,
			@RequestBody List<SubmitAnswerReq> answers
	) {
		examTakingService.saveAnswers(Long.parseLong(examRecordId), answers);
		return R.ok();
	}
	
	/**
	 * 提交答案：
	 * 同步批改选择/判断题，简答题留待人工批改
	 */
	@PostMapping("/submit/{examRecordId}")
	public R<Void> submitAnswers(
			@PathVariable String examRecordId,
			@RequestBody List<SubmitAnswerReq> answers
	) {
		examTakingService.submitAnswers(Long.parseLong(examRecordId), answers);
		return R.ok();
	}
	
	/**
	 * 人工判卷（**批量**）：给若干条答题记录打分（简答题用），
	 * 顺带重算该场考试的 `score` 并按「还有没有没判的答案」推进 `status`。
	 * <p>
	 * 入参数组必须**同属一场考试**（总分/状态是记录级的）；得分上限 = 该题在这张卷上的配分，
	 * 超了 422；考试进行中（ONGOING）的记录不给判。
	 */
	@PostMapping("/grade")
	public R<Void> gradeAnswers(@RequestBody @Valid List<@Valid GradeAnswerReq> answers) {
		examGradingService.gradeAnswers(answers);
		return R.ok();
	}
	
	/**
	 * 获取当前用户的考试记录列表
	 */
	@SaCheckLogin
	@GetMapping("/history")
	public R<List<ExamRecords>> getExamHistory() {
		return R.ok(examTakingService.getExamHistory(EXAM_RECORD_ITEM));
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
	@GetMapping("/records/{recordId}/detail")
	public R<ExamRecordDetail> getRecordDetail(@PathVariable String recordId) {
		return R.ok(examRecordQueryService.getRecordDetailForAuthor(Long.parseLong(recordId)));
	}
}
