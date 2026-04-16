package com.yyjy.controller

import com.yyjy.service.StatsService
import org.springframework.web.bind.annotation.RestController

/**
 * @author Nyxcirea
 * date 2026/4/4
 * description: TODO
 */
@RestController
class StatsController(
    private val statsService: StatsService
) {
}