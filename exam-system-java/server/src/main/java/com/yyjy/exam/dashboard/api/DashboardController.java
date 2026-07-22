package com.yyjy.exam.dashboard.api;

import cn.dev33.satoken.annotation.SaCheckRole;
import com.yyjy.exam.common.convention.result.R;
import com.yyjy.exam.dashboard.service.DashboardService;
import com.yyjy.exam.entity.dashboard.io.res.DashboardStats;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SaCheckRole("admin")
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {
	
	private final DashboardService dashboardService;
	
	@GetMapping("/stats")
	public R<DashboardStats> stats() {
		return R.ok(dashboardService.getStats());
	}
}
