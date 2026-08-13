package com.yyjy.exam.exam;

import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.exam.service.ExamRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.Predicate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 定时任务：
 * 1. 超时 ONGOING 记录 → 强制交卷 → 阅卷
 * 2. SUBMITTED 记录（消费者失败回退）→ 重新推送阅卷
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class ExamTimeoutScheduler {
	
	private final JSqlClient sqlClient;
	private final ExamRecordService examRecordService;
	
	@Scheduled(fixedRate = 60_000)
	public void autoSubmitTimeoutExams() {
		var examTable = ExamRecordsTable.$;
		
		// 找出所有因为异常（如考生未主动交卷、网络中断等）而“卡”在 ONGOING 状态的考试。
		// 1. 超时 ONGOING → GRADING → 推送
		var timeoutRecords = sqlClient.createQuery(examTable)
				                     .where(examTable.status().eq(ExamRecordStatus.ONGOING))
				                     .where(
						                     Predicate.sql(
								                     "TIMESTAMPADD(MINUTE, %e, %e) <= NOW()",
								                     it -> it
										                           .expression(examTable.startTime())
										                           .expression(examTable.paper().duration())
						                     )
				                     )
				                     .select(examTable, examTable.paper().duration())
				                     .execute();
		
		var now = LocalDateTime.now();
		int ongoingCount = 0;
		
		for (var tuple : timeoutRecords) {
			var record = tuple.get_1();
			var duration = tuple.get_2();
			var deadline = Objects.requireNonNull(record.startTime()).plusMinutes(duration);
			if (now.isAfter(deadline)) {
				// 批阅超时试卷
				examRecordService.handleTimeoutSubmit(record.id());
				ongoingCount++;
			}
		}
		if (ongoingCount > 0) {
			log.info("定时任务：超时自动交卷 {} 份", ongoingCount);
		}
		
		// 2. SUBMITTED 记录补偿（消费者失败后回退至此）
		var submittedRecords = sqlClient.createQuery(examTable)
				                       .where(examTable.status().eq(ExamRecordStatus.SUBMITTED))
				                       .select(examTable)
				                       .execute();
		for (var record : submittedRecords) {
			examRecordService.handleTimeoutSubmit(record.id());
		}
		if (!submittedRecords.isEmpty()) {
			log.info("定时任务：重新推送 {} 份阅卷失败的记录", submittedRecords.size());
		}
	}
}
