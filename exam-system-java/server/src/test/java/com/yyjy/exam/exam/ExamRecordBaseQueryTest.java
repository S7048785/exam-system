package com.yyjy.exam.exam;

import com.yyjy.exam.entity.Immutables;
import com.yyjy.exam.entity.exam.dto.ExamStats;
import com.yyjy.exam.entity.exam.dto.PaperReport;
import com.yyjy.exam.entity.exam.dto.PaperReportMapper;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.exam.entity.ExamRecordsTable;
import com.yyjy.exam.entity.paper.entity.PaperExamSettingsTable;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.JoinType;
import org.babyfish.jimmer.sql.ast.Expression;
import org.babyfish.jimmer.sql.ast.Predicate;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 用 Jimmer 的 BaseQuery 复刻这条手写 SQL：
 * <pre>
 * SELECT p.name, s.start, s.end, p.total_score, s.passing_score,
 *        COALESCE(er.submitted_count, 0), COALESCE(er.grading_count, 0), COALESCE(er.graded_count, 0)
 * FROM paper p
 * LEFT JOIN paper_exam_settings s ON s.paper_id = p.id
 * LEFT JOIN (SELECT paper_id,
 *                   SUM(status IN ('GRADING','GRADED')) AS submitted_count,
 *                   SUM(status = 'GRADING')             AS grading_count,
 *                   SUM(status = 'GRADED')              AS graded_count
 *            FROM exam_records GROUP BY paper_id) er ON er.paper_id = p.id
 * ORDER BY p.id DESC
 * </pre>
 * 三处关键点（缺一个就对不上）：<br>
 * ① 聚合派生表 = {@code createBaseQuery(...).groupBy(...).addSelect(...)...asBaseTable()}；<br>
 * ② 把派生表 left join 进来 = {@code weakJoin(baseTable, JoinType.LEFT, ...)}（默认重载是 inner join）；<br>
 * ③ 条件计数没有 sumIf，用 {@code caseBuilder(...).when(cond, 1L).otherwise(0L).sum()}；
 * 派生表落空产生的 NULL 用 {@code .coalesce(0L)} 顶掉。
 * <p>
 * ⚠️ dev 档真实库。用例自己插行、{@code @AfterEach} 按 `student_name` 前缀删掉，不碰真实数据。
 */
@SpringBootTest
class ExamRecordBaseQueryTest {
	
	/**
	 * 本用例造的数据都带这个前缀，跑完按前缀清掉
	 */
	private static final String NAME_PREFIX = "BaseQuery测试-";
	
	@Autowired
	private JSqlClient sqlClient;
	
	@Autowired
	private ExamRecordsRepository examRecordsRepo;
	
	@Autowired
	private DataSource dataSource;
	
	@AfterEach
	void cleanUp() throws Exception {
		try (Connection conn = dataSource.getConnection();
		     Statement st = conn.createStatement()) {
			st.executeUpdate("DELETE FROM exam_records WHERE student_name LIKE '" + NAME_PREFIX + "%'");
		}
	}
	
	/**
	 * ① BaseQuery 版本 —— 就是手写 SQL 的逐句翻译。
	 * <p>
	 * ⚠️ 生产上用的时候，`where` 里得加 `paper.userId().eq(StpUtil.getLoginIdAsLong())`（多用户隔离）；
	 * 本用例为的是和整库手写 SQL 逐行比对，所以**故意不过滤用户**。
	 * <p>
	 * 🔴 派生表这里必须用**位置化**写法（`addSelect` + `get_1()/get_2()/...`），不能换成
	 * `@TypedTuple` 的命名表（`ExamStatsMapper` + `ExamStatsTable`）：
	 * 0.12.2 给实体表生成的 {@code weakJoin} 里写死了 `(BaseTableSymbol) targetBaseTable`
	 * （见 `PaperTableEx.weakJoin`），而命名表 `ExamStatsTable` 只是 `AbstractTypedBaseTable` 包装，
	 * 不是 `BaseTableSymbol` ⇒ **运行时 ClassCastException**（已实测）。
	 * 位置化 `asBaseTable()` 返回的是内部 `BaseTableSymbols.TableN`，正好满足这个转型。
	 * 命名 mapper 留给外层结果投影（`PaperReportMapper`），那条路是好的。
	 *
	 * @param paperId 传 null = 全表
	 */
	private List<PaperReport> queryPapers(Long paperId) {
		// ── 内层派生表：exam_records GROUP BY paper_id ──────────────────
		var er = ExamRecordsTable.$;
		
		// SUM(status IN ('GRADING','GRADED')) 的 DSL 写法：
		// Jimmer 没有 sumIf，Predicate 虽然 extends Expression<Boolean> 但没有 sum()，
		// 标准写法是 caseBuilder(...).when(条件, 1L).otherwise(0L).sum() → sum(case when ... then ? else ? end)
		Predicate submittedCond = er.status().in(List.of(ExamRecordStatus.GRADING, ExamRecordStatus.GRADED));
		var submittedCount = Expression.numeric().caseBuilder(Long.class)
				                     .when(submittedCond, 1L)
				                     .otherwise(0L)
				                     .sum();
		var gradingCount = Expression.numeric().caseBuilder(Long.class)
				                   .when(er.status().eq(ExamRecordStatus.GRADING), 1L)
				                   .otherwise(0L)
				                   .sum();
		var gradedCount = Expression.numeric().caseBuilder(Long.class)
				                  .when(er.status().eq(ExamRecordStatus.GRADED), 1L)
				                  .otherwise(0L)
				                  .sum();
		
		// groupBy / where 必须写在 addSelect 链**之前**（addSelect 之后返回的 Builder 不再有 groupBy）
		// get_1()=paperId、get_2()=submitted、get_3()=grading、get_4()=graded，顺序就是 addSelect 的顺序
		var stats = sqlClient.createBaseQuery(er)
				            .groupBy(er.paperId())
				            .addSelect(er.paperId())
				            .addSelect(submittedCount)
				            .addSelect(gradingCount)
				            .addSelect(gradedCount)
				            .asBaseTable();
		
		// ── 外层：paper ──LEFT── settings ──LEFT── 派生表 ──────────────
		var paper = PaperTable.$;
		// 设置行可能不存在（建卷不再预写）⇒ 必须显式 LEFT，否则整张卷会从列表里消失
		PaperExamSettingsTable settings = paper.examSettings(JoinType.LEFT);
		// weakJoin 不带 JoinType 的重载是 **inner join**，这里必须显式 LEFT
		var joinedStats = paper.asTableEx()
				                .weakJoin(stats, JoinType.LEFT,
						                (p, st) -> p.id().eq(st.get_1()));
		
		var query = sqlClient.createQuery(paper);
		if (paperId != null) {
			query.where(paper.id().eq(paperId));
		}
		
		// 投影直接落回 @TypedTuple（PaperReport 定义列顺序），不用手工 Tuple8
		return query.orderBy(paper.id().desc())
				       .select(PaperReportMapper
						               .paperName(paper.name())
						               .start(settings.start())
						               .end(settings.end())
						               .totalScore(paper.totalScore())
						               .passingScore(settings.passingScore())
						               .submittedCount(joinedStats.get_2().coalesce(0L))
						               .gradingCount(joinedStats.get_3().coalesce(0L))
						               .gradedCount(joinedStats.get_4().coalesce(0L)))
				       .execute();
	}
	
	// ────────────────────────────────────────────────────────────────
	// 用例 1：和三处「LEFT JOIN / COALESCE 落空」的真实数据逐行对比
	// ────────────────────────────────────────────────────────────────
	
	@Test
	@DisplayName("BaseQuery 版本与手写 SQL 逐行一致（含派生表落空 → 0）")
	void matchesRawSqlRowByRow() throws Exception {
		List<PaperReport> byJimmer = queryPapers(null);
		List<PaperReport> byRawSql = rawSqlOracle();
		
		System.out.println("[BaseQuery] 行数 = " + byJimmer.size() + "，手写 SQL 行数 = " + byRawSql.size());
		byJimmer.stream().limit(5).forEach(r -> System.out.println("[BaseQuery] " + r));
		
		// 行数一致 = 派生表的 LEFT JOIN 没被吞成 inner（否则「没有考试记录的卷」会整行消失）
		assertEquals(byRawSql.size(), byJimmer.size(),
				"行数对不上 —— 少了说明弱连接/派生表 join 变成了 inner join");
		
		for (int i = 0; i < byRawSql.size(); i++) {
			PaperReport expected = byRawSql.get(i);
			PaperReport actual = byJimmer.get(i);
			String at = "第 " + i + " 行（" + expected.getPaperName() + "）";
			
			assertEquals(expected.getPaperName(), actual.getPaperName(), at + " 试卷名");
			assertEquals(expected.getStart(), actual.getStart(), at + " 开始时间");
			assertEquals(expected.getEnd(), actual.getEnd(), at + " 结束时间");
			assertEquals(expected.getTotalScore(), actual.getTotalScore(), at + " 总分");
			assertEquals(expected.getPassingScore(), actual.getPassingScore(), at + " 及格分");
			assertEquals(expected.getSubmittedCount(), actual.getSubmittedCount(), at + " 交卷数");
			assertEquals(expected.getGradingCount(), actual.getGradingCount(), at + " 未评卷数");
			assertEquals(expected.getGradedCount(), actual.getGradedCount(), at + " 已评卷数");
		}
	}
	
	// ────────────────────────────────────────────────────────────────
	// 用例 2：三种状态各造一条，验增量（不依赖库里原有数据）
	// ────────────────────────────────────────────────────────────────
	
	@Test
	@DisplayName("新增 GRADING / GRADED / ONGOING 各一条 ⇒ 交卷 +2、未评 +1、已评 +1，ONGOING 不计")
	void countsThreeStatusesWithDelta() throws Exception {
		long paperId = firstPaperId();
		
		PaperReport before = queryPapers(paperId).getFirst();
		System.out.println("[增量] 造数据前 = " + before);
		
		long stamp = System.currentTimeMillis();
		insertRecord(paperId, NAME_PREFIX + stamp + "-GRADING", ExamRecordStatus.GRADING);
		insertRecord(paperId, NAME_PREFIX + stamp + "-GRADED", ExamRecordStatus.GRADED);
		insertRecord(paperId, NAME_PREFIX + stamp + "-ONGOING", ExamRecordStatus.ONGOING);
		
		PaperReport after = queryPapers(paperId).getFirst();
		System.out.println("[增量] 造数据后 = " + after);
		
		assertEquals(before.getSubmittedCount() + 2, after.getSubmittedCount(),
				"交卷数 = GRADING + GRADED 两类之和");
		assertEquals(before.getGradingCount() + 1, after.getGradingCount(),
				"未评卷数只数 GRADING");
		assertEquals(before.getGradedCount() + 1, after.getGradedCount(),
				"已评卷数只数 GRADED");
		
		// ONGOING 不该影响任何一列，其余列也不该被这三条记录改动
		assertEquals(before.getPaperName(), after.getPaperName(), "试卷名不该变");
		assertEquals(before.getStart(), after.getStart(), "开始时间不该变");
		assertEquals(before.getEnd(), after.getEnd(), "结束时间不该变");
		assertEquals(before.getTotalScore(), after.getTotalScore(), "总分不该变");
		assertEquals(before.getPassingScore(), after.getPassingScore(), "及格分不该变");
	}
	
	// ────────────────────────────────────────────────────────────────
	// 用例 3：确认「派生表落空」这条路径真的被数据覆盖到了
	// ────────────────────────────────────────────────────────────────
	
	@Test
	@DisplayName("没有考试记录的试卷照样出现在列表里（COALESCE 到 0）")
	void papersWithoutRecordsStillAppear() throws Exception {
		List<PaperReport> all = queryPapers(null);
		
		assertEquals(countPapers(), all.size(),
				"结果行数必须等于 paper 表行数 —— 少了就是 inner join 吞掉了没有记录的卷");
		
		long zeroRows = all.stream().filter(r -> r.getSubmittedCount() == 0).count();
		System.out.println("[LEFT JOIN] 交卷数为 0 的卷 = " + zeroRows + " / " + all.size());
		assertTrue(zeroRows > 0,
				"库里每张卷都有考试记录，这条用例没能覆盖 COALESCE 分支（数据太干净，或 join 写错了）");
	}
	
	// ────────────────────────────────────────────────────────────────
	// 用例 4：两种实现等价性 —— 「两条查询」vs「BaseQuery 一条 SQL」
	// ────────────────────────────────────────────────────────────────
	
	@Test
	@DisplayName("两条查询版本与 BaseQuery 版本结果完全一致")
	void twoPhaseMatchesBaseQuery() throws Exception {
		List<PaperReport> byBaseQuery = queryPapers(null);
		List<PaperReport> byTwoPhase = queryPapersTwoPhase(null);
		assertEquals(byBaseQuery, byTwoPhase, "全表：两条查询与单条 SQL 结果不一致");
		
		long paperId = firstPaperId();
		assertEquals(queryPapers(paperId), queryPapersTwoPhase(paperId), "单卷：两者结果不一致");
		
		System.out.println("[等价性] 两条查询与 BaseQuery 结果一致，行数 = " + byTwoPhase.size());
	}
	
	/**
	 * 两条查询版本 —— 也是本仓库现有的套路（见 `PaperExamSettingsRepository.findDurationMapByPaperIds`）。
	 * <p>
	 * 好处有两个，都跟这条 SQL 的形状有关：
	 * <ol>
	 *   <li>列表页的分页/筛选**完全复用**现有 `PaperRepository#listPapersByNameAndStatus`，
	 *       不用把「四态由 is_published+start+end 推导」那套逻辑在 BaseQuery 里再写一遍；</li>
	 *   <li>第二条 SQL 带上 {@code where paper_id in (本页 id)}，只聚合**当前页这 10 张卷**；
	 *       而 BaseQuery 那条 SQL 的派生表是 `Materialize`、没有条件下推，
	 *       每次请求都会把整张 `exam_records` 聚合一遍（已用 EXPLAIN 验证）。</li>
	 * </ol>
	 * 代价：多一次往返；两次读之间没有快照一致性（统计页无所谓）。
	 * <p>
	 * ⚠️ 生产上要做分页的话，第一条 SQL 用 `.select(...).fetchPage(page - 1, size)`，
	 * 然后只对本页的 id 调 {@link #loadExamStats}；本用例为了和整表比对照，就不分页了。
	 */
	private List<PaperReport> queryPapersTwoPhase(Long paperId) {
		var paper = PaperTable.$;
		PaperExamSettingsTable settings = paper.examSettings(JoinType.LEFT);
		
		// ① 第 1 条 SQL：试卷行（生产上这里就是分页那一查询）
		var query = sqlClient.createQuery(paper);
		if (paperId != null) {
			query.where(paper.id().eq(paperId));
		}
		var rows = query.orderBy(paper.id().desc())
				           .select(paper.id(),
						           paper.name(),
						           settings.start(),
						           settings.end(),
						           paper.totalScore(),
						           settings.passingScore())
				           .execute();
		
		// ② 第 2 条 SQL：只聚合这批卷
		Map<Long, ExamStats> stats = loadExamStats(rows.stream().map(t -> t.get_1()).toList());
		
		return rows.stream()
				       .map(t -> {
					       ExamStats s = stats.get(t.get_1());
					       return new PaperReport(
							       t.get_2(), t.get_3(), t.get_4(), t.get_5(), t.get_6(),
							       s == null ? 0L : s.getSubmittedCount(),
							       s == null ? 0L : s.getGradingCount(),
							       s == null ? 0L : s.getGradedCount());
				       })
				       .toList();
	}
	
	/**
	 * 第 2 条 SQL：`WHERE paper_id IN (...) GROUP BY paper_id`。
	 * 走 `exam_records_paper_id_status_index(paper_id, status)` 的前缀，是本页数据量级的范围扫描。
	 */
	private Map<Long, ExamStats> loadExamStats(List<Long> paperIds) {
		if (paperIds.isEmpty()) {
			return Map.of();
		}
		var er = ExamRecordsTable.$;
		Predicate submittedCond = er.status().in(List.of(ExamRecordStatus.GRADING, ExamRecordStatus.GRADED));
		
		Map<Long, ExamStats> result = new HashMap<>();
		for (var tuple : sqlClient.createQuery(er)
				                 .where(er.paperId().in(paperIds))
				                 .groupBy(er.paperId())
				                 .select(er.paperId(),
						                 Expression.numeric().caseBuilder(Long.class)
								                 .when(submittedCond, 1L).otherwise(0L).sum(),
						                 Expression.numeric().caseBuilder(Long.class)
								                 .when(er.status().eq(ExamRecordStatus.GRADING), 1L).otherwise(0L).sum(),
						                 Expression.numeric().caseBuilder(Long.class)
								                 .when(er.status().eq(ExamRecordStatus.GRADED), 1L).otherwise(0L).sum())
				                 .execute()) {
			ExamStats item = new ExamStats();
			item.setPaperId(tuple.get_1());
			item.setSubmittedCount(tuple.get_2());
			item.setGradingCount(tuple.get_3());
			item.setGradedCount(tuple.get_4());
			result.put(tuple.get_1(), item);
		}
		return result;
	}
	
	// ────────────────────────────────────────────────────────────────
	// 手写 SQL oracle：跟上面那条 BaseQuery 是同一个语义，用来当对照
	// ────────────────────────────────────────────────────────────────
	
	private List<PaperReport> rawSqlOracle() throws Exception {
		String sql = """
				SELECT p.name,
				       s.start,
				       s.end,
				       p.total_score,
				       s.passing_score,
				       COALESCE(er.submitted_count, 0) AS submitted_count,
				       COALESCE(er.grading_count, 0)   AS grading_count,
				       COALESCE(er.graded_count, 0)    AS graded_count
				FROM paper p
				LEFT JOIN paper_exam_settings s ON s.paper_id = p.id
				LEFT JOIN (
				    SELECT paper_id,
				           SUM(status IN ('GRADING','GRADED')) AS submitted_count,
				           SUM(status = 'GRADING')             AS grading_count,
				           SUM(status = 'GRADED')              AS graded_count
				    FROM exam_records
				    GROUP BY paper_id
				) er ON er.paper_id = p.id
				ORDER BY p.id DESC
				""";
		
		List<PaperReport> rows = new ArrayList<>();
		try (Connection conn = dataSource.getConnection();
		     Statement st = conn.createStatement();
		     ResultSet rs = st.executeQuery(sql)) {
			while (rs.next()) {
				Timestamp start = rs.getTimestamp("start");
				Timestamp end = rs.getTimestamp("end");
				rows.add(new PaperReport(
						rs.getString("name"),
						start == null ? null : start.toLocalDateTime(),
						end == null ? null : end.toLocalDateTime(),
						rs.getInt("total_score"),
						// ⚠️ 注意：这里 NULL 会读成 0。而 PaperReport.passingScore 是基本类型 int，
						// 一旦出现「没有设置行」的卷（建卷不再预写设置行，这是可能的），
						// Jimmer 侧 createTuple 会在 `(Integer)args[4]` 拆箱时 NPE —— 用例会先炸给你看。
						rs.getInt("passing_score"),
						rs.getLong("submitted_count"),
						rs.getLong("grading_count"),
						rs.getLong("graded_count")
				));
			}
		}
		return rows;
	}
	
	private long countPapers() throws Exception {
		try (Connection conn = dataSource.getConnection();
		     Statement st = conn.createStatement();
		     ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM paper")) {
			assertTrue(rs.next());
			return rs.getLong(1);
		}
	}
	
	private long firstPaperId() throws Exception {
		try (Connection conn = dataSource.getConnection();
		     Statement st = conn.createStatement();
		     ResultSet rs = st.executeQuery("SELECT id FROM paper ORDER BY id LIMIT 1")) {
			assertTrue(rs.next(), "库里一张试卷都没有，没法新建考试记录");
			return rs.getLong(1);
		}
	}
	
	private void insertRecord(long paperId, String studentName, ExamRecordStatus status) {
		LocalDateTime now = LocalDateTime.now();
		// 故意不设 id，验证生成器真的接上了
		ExamRecords saved = examRecordsRepo.save(
				Immutables.createExamRecords(draft -> {
					draft.setPaperId(paperId);
					draft.setStudentName(studentName);
					draft.setStartTime(now);
					if (status != ExamRecordStatus.ONGOING) {
						draft.setEndTime(now);   // 已交卷的才有结束时间
					}
					draft.setCreateTime(now);
					draft.setWindowSwitches(0);
					draft.setStatus(status);
				}),
				SaveMode.INSERT_ONLY);
		System.out.println("[增量] 插入 " + status + " id=" + saved.id() + " name=" + studentName);
	}
}
