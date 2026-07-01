package com.yyjy.exam.exam.api;

import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.io.req.StartExamReq;
import com.yyjy.exam.entity.exam.io.req.SubmitAnswerReq;
import com.yyjy.exam.exam.service.ExamRecordService;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.client.meta.Api;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Api
@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamRecordService examRecordService;

    @Api
    @PostMapping("/start")
    public R<ExamRecords> startExam(@RequestBody StartExamReq req) {
        return R.ok(examRecordService.startExam(req.paperId(), req.studentName()));
    }

    @Api
    @GetMapping("/{id}")
    public R<ExamRecords> getExamRecord(@PathVariable int id) {
        return R.ok(examRecordService.getExamRecord(id));
    }

    @Api
    @PostMapping("/submit/{examRecordId}")
    public R<Void> submitAnswers(
            @PathVariable int examRecordId,
            @RequestBody List<SubmitAnswerReq> answers
    ) {
        examRecordService.submitAnswers(examRecordId, answers);
        return R.ok();
    }
}
