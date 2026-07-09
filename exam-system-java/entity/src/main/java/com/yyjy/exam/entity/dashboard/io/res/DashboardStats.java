package com.yyjy.exam.entity.dashboard.io.res;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record DashboardStats(
        long userCount,
        long questionCount,
        long paperCount,
        long examRecordCount,
        List<RecentExamRecord> recentExamRecords
) {
    @Builder
    public record RecentExamRecord(
            String studentName,
            String paperName,
            Integer score,
            LocalDateTime createTime
    ) {}
}
