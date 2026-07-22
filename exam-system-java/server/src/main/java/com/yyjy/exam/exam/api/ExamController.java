package com.yyjy.exam.exam.api;

import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.io.req.StartExamReq;
import com.yyjy.exam.entity.exam.io.req.SubmitAnswerReq;
import com.yyjy.exam.exam.service.ExamRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {
	
	private final ExamRecordService examRecordService;
	
	/**
	 * 用户开始考试
	 */
	@PostMapping("/start")
	public R<ExamRecords> startExam(@RequestBody StartExamReq req) {
		return R.ok(examRecordService.startExam(req.paperId(), req.studentName()));
	}
	
	/**
	 * 获取考试记录
	 *
	 * @param id
	 * @return
	 */
	@GetMapping("/{id}")
	public R<ExamRecords> getExamRecord(@PathVariable int id) {
		return R.ok(examRecordService.getExamRecord(id));
	}
	
	@PostMapping("/submit/{examRecordId}")
	public R<Void> submitAnswers(
			@PathVariable int examRecordId,
			@RequestBody List<SubmitAnswerReq> answers
	) {
		examRecordService.submitAnswers(examRecordId, answers);
		return R.ok();
	}
}
