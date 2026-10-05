package com.yyjy.exam.exam.service;

import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.convention.result.PageRes;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.Fetchers;
import com.yyjy.exam.entity.Tables;
import com.yyjy.exam.entity.exam.dto.ExamRecordDetail;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.entity.exam.io.req.ExamRecordListQuery;
import com.yyjy.exam.entity.exam.io.req.ExamRecordStatsQuery;
import com.yyjy.exam.entity.exam.io.res.ExamRecordListItemRes;
import com.yyjy.exam.entity.exam.io.res.ExamRecordStatsRes;
import com.yyjy.exam.entity.paper.entity.PaperExamSettings;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import com.yyjy.exam.paper.repository.PaperExamSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.Predicate;
import org.babyfish.jimmer.sql.fetcher.Fetcher;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 成绩读取（**控制台侧**）：成绩列表 / 统计 / 试卷作者看某条记录的答题详情。
 */
@RequiredArgsConstructor
@Service
public class ExamRecordQueryService {
	
	private static final Fetcher<ExamRecords> RECORD_LIST_ITEM =
			Fetchers.EXAM_RECORDS_FETCHER
					.studentName()
					.score()
					.startTime()
					.endTime()
					.status();
	
	/**
	 * 成绩统计取数图谱：只要三个标量列（成绩 / 交卷时间 / 状态）就够算「展示成绩」。
	 */
	private static final Fetcher<ExamRecords> RECORD_STATS_ITEM =
			Fetchers.EXAM_RECORDS_FETCHER
					.score()
					.endTime()
					.status();
	private final ExamRecordsRepository examRecordsRepo;
	private final PaperExamSettingsRepository paperExamSettingsRepo;
	private final JSqlClient sqlClient;
	private final ExamRecordSupport support;
	
	/**
	 * 「这场的成绩还没定稿」：状态为 ONGOING、或没有交卷时间。
	 * <p>
	 * 两个条件都要判 —— 超时检测 {@code checkAndHandleTimeout} 只写 `endTime` 不改状态，
	 * 所以库里可能存在「状态 ONGOING 但已有 endTime」的记录，那条同样算没定稿。
	 */
	private static boolean isNotFinished(ExamRecords r) {
		return r.endTime() == null || ExamRecordStatus.ONGOING.equals(r.status());
	}
	
	/**
	 * 「展示成绩」口径的唯一实现 —— 列表与统计**共用**，两处永远不会漂移：
	 * 未定稿 ⇒ 0；否则取记录里的分数（NULL 按 0）。
	 */
	private static int displayScore(ExamRecords r) {
		return isNotFinished(r) ? 0 : (r.score() == null ? 0 : r.score());
	}
	
	/**
	 * 成绩列表（**控制台**：试卷作者查看本卷全部考试记录）。
	 */
	public PageRes<ExamRecordListItemRes> listPaperRecords(ExamRecordListQuery query) {
		long paperId = query.paperId();
		
		// ---- 1. 归属校验 + 取卷面总分（一次查询两个标量）----
		int totalScore = support.requireOwnedPaper(paperId);
		
		// ---- 2. 及格分：设置行可能不存在（建卷不再预写），缺失按 0 ----
		PaperExamSettings settings = paperExamSettingsRepo.findByPaperId(paperId);
		int passingScore = settings == null ? 0 : settings.passingScore();
		
		// ---- 3. 分页查记录（成绩降序，同分按 id 降序）----
		int page = query.page();
		int size = query.size();
		ExamRecordsTable t = Tables.EXAM_RECORDS_TABLE;
		var q = examRecordsRepo.sql().createQuery(t)
				        .where(t.paperId().eq(paperId));
		String name = query.name();
		if (name != null && !name.isBlank()) {
			// like 默认 LikeMode.ANYWHERE（两侧 %），与试卷列表的名称搜索口径一致
			q.where(t.studentName().like(name.trim()));
		}
		if (query.status() != null) {
			q.where(t.status().eq(query.status()));
		}
		Boolean passed = query.passed();
		if (passed != null) {
			// 及格判据与表格展示、统计**同源**：`coalesce(score, 0)` 就是「展示成绩」——
			// 未交卷的记录 score 为 NULL，coalesce 成 0，自然落到「未及格」一侧。
			// 及格分 0 的卷里「未及格」会筛不到任何记录，这是数据本身决定的，不是 bug。
			var isPassed = t.score().coalesce(0).ge(passingScore);
			q.where(passed ? isPassed : Predicate.not(isPassed));
		}
		var res = q.orderBy(t.score().coalesce(0).desc(), t.id().desc())
				          .select(t.fetch(RECORD_LIST_ITEM))
				          .fetchPage(page - 1, size);
		
		// ---- 4. 组装返回：名次 = 全局位置 ----
		int offset = (page - 1) * size;
		List<ExamRecordListItemRes> list = new ArrayList<>(res.getRows().size());
		for (int i = 0; i < res.getRows().size(); i++) {
			list.add(toListItem(res.getRows().get(i), offset + i + 1, passingScore, totalScore));
		}
		return PageRes.<ExamRecordListItemRes>builder()
				       .page(page)
				       .pageSize(size)
				       .total(res.getTotalRowCount())
				       .list(list)
				       .build();
	}
	
	/**
	 * 成绩统计（控制台：表格上方的汇总数字）。
	 */
	public ExamRecordStatsRes getRecordStats(ExamRecordStatsQuery query) {
		long paperId = query.paperId();
		support.requireOwnedPaper(paperId);
		
		PaperExamSettings settings = paperExamSettingsRepo.findByPaperId(paperId);
		int passingScore = settings == null ? 0 : settings.passingScore();
		
		ExamRecordsTable t = Tables.EXAM_RECORDS_TABLE;
		List<ExamRecords> records = examRecordsRepo.sql().createQuery(t)
				                            .where(t.paperId().eq(paperId))
				                            .select(t.fetch(RECORD_STATS_ITEM))
				                            .execute();
		
		int participantCount = records.size();
		int passCount = 0;
		int maxScore = 0;
		int minScore = 0;
		long sum = 0L;
		for (int i = 0; i < participantCount; i++) {
			int score = displayScore(records.get(i));
			if (score >= passingScore) {
				passCount++;
			}
			if (i == 0 || score > maxScore) {
				maxScore = score;
			}
			if (i == 0 || score < minScore) {
				minScore = score;
			}
			sum += score;
		}
		// 平均分返回原始值，保留几位小数由展示层决定
		double avgScore = participantCount == 0 ? 0d : (double) sum / participantCount;
		
		return new ExamRecordStatsRes(
				participantCount,
				passCount,
				participantCount - passCount,
				maxScore,
				avgScore,
				minScore
		);
	}
	
	/**
	 * 考生的答题详情（**控制台侧**：试卷作者查看本卷任意一条记录的作答，**只读**）。
	 */
	public ExamRecordDetail getRecordDetailForAuthor(long recordId) {
		ExamRecords record = support.findRecordOrThrow(recordId);
		long paperId = record.paperId();
		support.requireOwnedPaper(paperId);
		
		if (ExamRecordStatus.ONGOING.equals(record.status())) {
			throw new BusinessException(MessageConstant.EXAM_DETAIL_NOT_AVAILABLE_ONGOING);
		}
		ExamRecordDetail detail = sqlClient.findById(ExamRecordDetail.class, recordId);
		if (detail == null) {
			throw new BusinessException("考试记录不存在");
		}
		
		// 题目顺序：DTO 取数不带 ORDER BY，`paper_question` 也没有排序列 ⇒
		// 按「题目加进试卷的先后」重排一遍，题号才稳定；已从试卷移除的题排到最后。
		//List<Long> orderedIds = paperQuestionRepo.findOrderedQuestionIdsByPaperId(paperId);
		//List<ExamRecordDetail.TargetOf_paper.TargetOf_questions> questions =
		//		new ArrayList<>(detail.getPaper().getQuestions());
		//questions.sort(Comparator.comparingInt(
		//		(ExamRecordDetail.TargetOf_paper.TargetOf_questions q) -> {
		//			int index = orderedIds.indexOf(q.getId());
		//			return index < 0 ? Integer.MAX_VALUE : index;
		//		}));
		//detail.getPaper().setQuestions(questions);
		
		return detail;
	}
	
	/**
	 * 组装成绩列表的一行。
	 */
	private ExamRecordListItemRes toListItem(ExamRecords r, int rank, int passingScore, int totalScore) {
		LocalDateTime start = r.startTime();
		LocalDateTime end = r.endTime();
		boolean notFinished = isNotFinished(r);
		
		long usedSeconds = 0L;
		if (!notFinished && start != null) {
			// 时钟回拨等极端情况下 end 可能早于 start，兜底不为负
			usedSeconds = Math.max(0L, Duration.between(start, end).getSeconds());
		}
		int score = displayScore(r);
		
		return new ExamRecordListItemRes(
				String.valueOf(r.id()),
				r.studentName(),
				start,
				end,
				usedSeconds,
				passingScore,
				totalScore,
				score,
				rank,
				r.status()
		);
	}
}
