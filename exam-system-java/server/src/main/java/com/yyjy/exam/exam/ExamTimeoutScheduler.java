package com.yyjy.exam.exam;

import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.exam.service.ExamRecordService;
import com.yyjy.exam.paper.repository.PaperExamSettingsRepository;
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
	private final PaperExamSettingsRepository paperExamSettingsRepo;
	
	@Scheduled(fixedRate = 60_000)
	public void autoSubmitTimeoutExams() {
		var examTable = ExamRecordsTable.$;
		
		// 找出所有因为异常（如考生未主动交卷、网络中断等）而“卡”在 ONGOING 状态的考试。
		// 1. 超时 ONGOING → GRADING → 推送
		// 考试时长已搬到 paper_exam_settings，SQL 里没法再直接 TIMESTAMPADD(paper.duration)；
		// 改成两步：先取全部 ONGOING 记录，再按 paperId 批量取时长，deadline 在 Java 里算
		// （下面本来就会用 Java 复核 deadline，语义不变）
		var ongoingRecords = sqlClient.createQuery(examTable)
				                    .where(examTable.status().eq(ExamRecordStatus.ONGOING))
				                    .select(examTable)
				                    .execute();
		
		var durations = paperExamSettingsRepo.findDurationMapByPaperIds(
				ongoingRecords.stream().map(ExamRecords::paperId).distinct().toList());
		
		var now = LocalDateTime.now();
		int ongoingCount = 0;
		
		for (var record : ongoingRecords) {
			var duration = durations.get(record.paperId());
			if (duration == null || record.startTime() == null) {
				continue;
			}
			var deadline = record.startTime().plusMinutes(duration);
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
