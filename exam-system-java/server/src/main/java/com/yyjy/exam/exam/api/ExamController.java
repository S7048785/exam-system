package com.yyjy.exam.exam.api;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.Fetchers;
import com.yyjy.exam.entity.exam.dto.ExamRecordDetail;
import com.yyjy.exam.entity.exam.dto.ExamTakingView;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.io.req.StartExamReq;
import com.yyjy.exam.entity.exam.io.req.SubmitAnswerReq;
import com.yyjy.exam.exam.service.ExamRecordService;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
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
					.paper(Fetchers.PAPER_FETCHER.totalScore().passingScore());
	private final ExamRecordService examRecordService;
	
	/**
	 * 开始考试
	 * 需要登录。返回 examRecordId 供后续操作使用
	 */
	@SaCheckLogin
	@PostMapping("/start")
	public R<Integer> startExam(@RequestBody StartExamReq req) {
		int examRecordId = examRecordService.startExam(req.paperId(), req.studentName());
		return R.ok(examRecordId);
	}
	
	/**
	 * 获取答题页数据（无正确答案，供考试中展示题目）
	 */
	@GetMapping("/{id}/taking")
	public R<ExamTakingView> getExamTaking(@PathVariable int id) {
		return R.ok(examRecordService.getExamTaking(id));
	}
	
	/**
	 * 获取考试详情（含答题记录、评分结果、AI 批注）
	 */
	@GetMapping("/{id}/detail")
	public R<ExamRecordDetail> getExamDetail(@PathVariable int id) {
		return R.ok(examRecordService.getExamDetail(id));
	}
	
	/**
	 * 考试中手动保存答案（upsert，不改状态不触发评分）
	 */
	@PostMapping("/{examRecordId}/answers")
	public R<Void> saveAnswers(
			@PathVariable int examRecordId,
			@RequestBody List<SubmitAnswerReq> answers
	) {
		examRecordService.saveAnswers(examRecordId, answers);
		return R.ok();
	}
	
	/**
	 * 提交答案：
	 * 同步批改选择/判断题，简答题触发异步 AI 批改
	 */
	@PostMapping("/submit/{examRecordId}")
	public R<Void> submitAnswers(
			@PathVariable int examRecordId,
			@RequestBody List<SubmitAnswerReq> answers
	) {
		examRecordService.submitAnswers(examRecordId, answers);
		return R.ok();
	}
	
	/**
	 * 获取当前用户的考试记录列表
	 */
	@SaCheckLogin
	@GetMapping("/history")
	public R<List<ExamRecords>> getExamHistory() {
		return R.ok(examRecordService.getExamHistory(EXAM_RECORD_ITEM));
	}
}
