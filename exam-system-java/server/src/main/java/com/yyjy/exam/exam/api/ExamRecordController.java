package com.yyjy.exam.exam.api;

import com.yyjy.exam.common.convention.result.R;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/exam-record")
public class ExamRecordController {
	
	@PostMapping("/add")
	public R<Void> addExamRecord() {
		return R.ok();
	}
	
	@PutMapping("/update/{id}")
	public R<Void> updateExamRecord(@PathVariable long id) {
		return R.ok();
	}
	
	@DeleteMapping("/remove/{id}")
	public R<Void> removeExamRecord(@PathVariable long id) {
		return R.ok();
	}
	
	@GetMapping("/{id}")
	public R<Void> getExamRecord(@PathVariable long id) {
		return R.ok();
	}
	
	@GetMapping("/list")
	public R<Void> listExamRecords() {
		return R.ok();
	}
}
