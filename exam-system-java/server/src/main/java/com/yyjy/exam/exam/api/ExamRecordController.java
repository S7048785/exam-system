package com.yyjy.exam.exam.api;

import com.yyjy.exam.common.convention.result.R;
import org.babyfish.jimmer.client.meta.Api;
import org.springframework.web.bind.annotation.*;

@Api
@RestController
@RequestMapping("/exam-record")
public class ExamRecordController {

    @Api
    @PostMapping("/add")
    public R<Void> addExamRecord() {
        return R.ok();
    }

    @Api
    @PutMapping("/update/{id}")
    public R<Void> updateExamRecord(@PathVariable long id) {
        return R.ok();
    }

    @Api
    @DeleteMapping("/remove/{id}")
    public R<Void> removeExamRecord(@PathVariable long id) {
        return R.ok();
    }

    @Api
    @GetMapping("/{id}")
    public R<Void> getExamRecord(@PathVariable long id) {
        return R.ok();
    }

    @Api
    @GetMapping("/list")
    public R<Void> listExamRecords() {
        return R.ok();
    }
}
