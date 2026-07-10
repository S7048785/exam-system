package com.yyjy.exam.dashboard.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.yyjy.exam.common.constant.CacheConstant;
import com.yyjy.exam.common.util.RedisUtil;
import com.yyjy.exam.entity.dashboard.io.res.DashboardStats;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.entity.ExamRecordsFetcher;
import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.entity.paper.entity.PaperFetcher;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import com.yyjy.exam.entity.question.entity.QuestionsTable;
import com.yyjy.exam.entity.user.entity.UsersTable;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.JSqlClient;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {
	
	private static final long CACHE_TTL = 60L;
	private final JSqlClient sqlClient;
	private final RedisUtil redisUtil;
	
	public DashboardStats getStats() {
		// 1. Try Redis cache first
		String cached = redisUtil.get(CacheConstant.DASHBOARD_STATS_KEY);
		if (StrUtil.isNotBlank(cached)) {
			return JSONUtil.toBean(cached, DashboardStats.class);
		}
		
		// 2. Cache miss — query DB sequentially
		//    (simple COUNT(*) queries, each <1ms, sequential is fine)
		long userCount = countUsers();
		long questionCount = countQuestions();
		long paperCount = countPapers();
		long examRecordCount = countExamRecords();
		List<DashboardStats.RecentExamRecord> recentRecords = getRecentExamRecords(10);
		
		
		DashboardStats stats = DashboardStats.builder()
				                       .userCount(userCount)
				                       .questionCount(questionCount)
				                       .paperCount(paperCount)
				                       .examRecordCount(examRecordCount)
				                       .recentExamRecords(recentRecords)
				                       .build();
		
		// 3. Store in Redis for 60s
		redisUtil.set(CacheConstant.DASHBOARD_STATS_KEY, JSONUtil.toJsonStr(stats), CACHE_TTL);
		
		return stats;
	}
	
	private long countUsers() {
		var u = UsersTable.$;
		return sqlClient.createQuery(u)
				       .select(u.count())
				       .fetchFirst();
	}
	
	private long countQuestions() {
		var q = QuestionsTable.$;
		return sqlClient.createQuery(q)
				       .select(q.count())
				       .fetchFirst();
	}
	
	private long countPapers() {
		var p = PaperTable.$;
		return sqlClient.createQuery(p)
				       .select(p.count())
				       .fetchFirst();
	}
	
	private long countExamRecords() {
		var er = ExamRecordsTable.$;
		return sqlClient.createQuery(er)
				       .select(er.count())
				       .fetchFirst();
	}
	
	private List<DashboardStats.RecentExamRecord> getRecentExamRecords(int limit) {
		var er = ExamRecordsTable.$;
		
		List<ExamRecords> records = sqlClient.createQuery(er)
				                            .orderBy(er.createTime().desc())
				                            .select(er.fetch(
						                            ExamRecordsFetcher.$
								                            .studentName()
								                            .score()
								                            .createTime()
								                            .paper(PaperFetcher.$.name())
				                            ))
				                            .limit(limit)
				                            .execute();
		
		return records.stream()
				       .map(r -> DashboardStats.RecentExamRecord.builder()
						                 .studentName(r.studentName())
						                 .paperName(r.paper().name())
						                 .score(r.score())
						                 .createTime(r.createTime())
						                 .build())
				       .toList();
	}
}
