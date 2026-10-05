package com.yyjy.exam.exam;

import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.exam.service.ExamTakingService;
import com.yyjy.exam.paper.repository.PaperExamSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.babyfish.jimmer.sql.JSqlClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 定时任务：超时的 ONGOING 记录 → 强制交卷 →
 * 批改客观题并切状态（不含简答题 → GRADED；含简答题 → GRADING，等人工阅卷）。
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class ExamTimeoutScheduler {
	
	private final JSqlClient sqlClient;
	private final ExamTakingService examTakingService;
	private final PaperExamSettingsRepository paperExamSettingsRepo;
	
	@Scheduled(fixedRate = 60_000)
	public void autoSubmitTimeoutExams() {
		var examTable = ExamRecordsTable.$;
		
		// 找出所有因为异常（如考生未主动交卷、网络中断等）而“卡”在 ONGOING 状态的考试。
		// 超时 ONGOING → 自动交卷（客观题即判，简答题待人工）
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
				examTakingService.handleTimeoutSubmit(record.id());
				ongoingCount++;
			}
		}
		if (ongoingCount > 0) {
			log.info("定时任务：超时自动交卷 {} 份", ongoingCount);
		}
	}
}
