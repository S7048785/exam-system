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
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
public class DashboardService {
	
	private static final long CACHE_TTL = 60L;
	private final JSqlClient sqlClient;
	private final RedisUtil redisUtil;
	
	// 推荐使用专用线程池，避免耗尽 ForkJoinPool 公共资源
	private final ExecutorService executor = Executors.newFixedThreadPool(5);
	
	public DashboardStats getStats() {
		// 1. 尝试从缓存获取
		String cached = redisUtil.get(CacheConstant.DASHBOARD_STATS_KEY);
		if (StrUtil.isNotBlank(cached)) {
			return JSONUtil.toBean(cached, DashboardStats.class);
		}
		
		// 2. 并发执行所有查询
		CompletableFuture<Long> userCountFuture =
				CompletableFuture.supplyAsync(this::countUsers, executor);
		CompletableFuture<Long> questionCountFuture =
				CompletableFuture.supplyAsync(this::countQuestions, executor);
		CompletableFuture<Long> paperCountFuture =
				CompletableFuture.supplyAsync(this::countPapers, executor);
		CompletableFuture<Long> examRecordCountFuture =
				CompletableFuture.supplyAsync(this::countExamRecords, executor);
		CompletableFuture<List<DashboardStats.RecentExamRecord>> recentRecordsFuture =
				CompletableFuture.supplyAsync(() -> getRecentExamRecords(10), executor);
		
		// 等待所有任务完成
		CompletableFuture.allOf(
				userCountFuture, questionCountFuture, paperCountFuture,
				examRecordCountFuture, recentRecordsFuture
		).join();
		
		// 收集结果（join() 不会抛出受检异常，但实际应处理 ExecutionException）
		long userCount = userCountFuture.join();
		long questionCount = questionCountFuture.join();
		long paperCount = paperCountFuture.join();
		long examRecordCount = examRecordCountFuture.join();
		List<DashboardStats.RecentExamRecord> recentRecords = recentRecordsFuture.join();
		
		// 3. 组装结果并缓存
		DashboardStats stats = DashboardStats.builder()
				                       .userCount(userCount)
				                       .questionCount(questionCount)
				                       .paperCount(paperCount)
				                       .examRecordCount(examRecordCount)
				                       .recentExamRecords(recentRecords)
				                       .build();
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
