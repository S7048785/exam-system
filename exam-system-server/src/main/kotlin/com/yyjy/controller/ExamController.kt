package com.yyjy.controller

import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * @author Nyxcirea
 * date 2026/4/4
 * description: TODO
 */
@Tag(name = "考试管理", description = "考试流程相关操作，包括开始考试、答题提交、AI批阅、成绩查询等功能")
@RequestMapping("/exams")
@RestController
class ExamController {
}