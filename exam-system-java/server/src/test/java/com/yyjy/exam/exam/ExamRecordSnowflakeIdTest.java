package com.yyjy.exam.exam;

import com.yyjy.exam.entity.Immutables;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * `exam_records` 雪花 id 落地验证：建一行记录 → 把 id 查回来。
 * <p>
 * 判据（缺一不可）：
 * <ul>
 *   <li>不传 id 也能存进去 —— 靠 {@code @GeneratedValue(USER, SnowflakeIdGenerator)} 补；</li>
 *   <li>id 是雪花量级（本地这张表自增时代最大才两位数），且两条之间严格递增、毫秒位只差几毫秒；</li>
 *   <li>用裸 SQL 按该 id 能读回同一行 —— 证明写进库的就是它，不是内存里临时造的。</li>
 * </ul>
 * <p>
 * ⚠️ 连的是 dev 档真实库（localhost:3306/exam_system）。用例自己插行、{@code @AfterEach} 按
 * `student_name` 前缀删除，不碰真实数据。
 */
@SpringBootTest
class ExamRecordSnowflakeIdTest {
	
	private static final String NAME_PREFIX = "雪花ID测试-";
	/**
	 * 自增 id 长不成这个量级
	 */
	private static final long AUTO_INCREMENT_CEILING = 1_000_000_000L;
	
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
	
	@Test
	@DisplayName("建一行 exam_records 后，拿到的 id 是雪花 id 且能在库里查回来")
	void saveExamRecordAndReadIdBack() throws Exception {
		long paperId = firstPaperId();
		long stamp = System.currentTimeMillis();
		List<Long> ids = new ArrayList<>();
		
		for (int i = 0; i < 2; i++) {
			String name = NAME_PREFIX + stamp + "-" + i;
			LocalDateTime now = LocalDateTime.now();
			// 故意不设 id，验证生成器真的接上了
			ExamRecords saved = examRecordsRepo.save(
					Immutables.createExamRecords(draft -> {
						draft.setPaperId(paperId);
						draft.setStudentName(name);
						draft.setStartTime(now);
						draft.setCreateTime(now);
						draft.setWindowSwitches(0);
						draft.setStatus(ExamRecordStatus.ONGOING);
					}),
					SaveMode.INSERT_ONLY);
			ids.add(saved.id());
			Thread.sleep(5);
		}
		
		System.out.println("[雪花] save 返回的 id = " + ids);
		
		// 1) 雪花量级：不是 1/2/3
		for (Long id : ids) {
			assertTrue(id > AUTO_INCREMENT_CEILING, "id 只有 " + id + "，像自增而不是雪花");
		}
		// 2) 严格递增，且相邻两条的毫秒位只差几个单位（高位就是毫秒时间戳）
		long delta = ids.get(1) - ids.get(0);
		assertTrue(delta > 0, "id 没有递增：" + ids);
		assertTrue(delta >>> 22 <= 2_000, "相邻两条差 " + (delta >>> 22) + " 个毫秒单位，不像时间有序的雪花");
		
		// 3) 裸 SQL 按 id 读回（绕开任何缓存），顺带核对 id 位数
		try (Connection conn = dataSource.getConnection();
		     PreparedStatement ps = conn.prepareStatement(
				     "SELECT id, student_name FROM exam_records WHERE id = ?")) {
			for (int i = 0; i < ids.size(); i++) {
				Long id = ids.get(i);
				ps.setLong(1, id);
				try (ResultSet rs = ps.executeQuery()) {
					assertTrue(rs.next(), "库里查不到刚写入的 id：" + id);
					assertEquals(id.longValue(), rs.getLong("id"));
					assertEquals(NAME_PREFIX + stamp + "-" + i, rs.getString("student_name"));
				}
			}
		}
		
		System.out.println("[雪花] id 位数 = " + Long.toString(ids.get(1)).length()
				                   + "，JS 安全整数上限 = " + 9_007_199_254_740_991L
				                   + "，超了吗 = " + (ids.get(1) > 9_007_199_254_740_991L));
	}
	
	@Test
	@DisplayName("exam_records.id 已取消自增、无默认值（否则库里那条自增老路还在）")
	void idColumnIsNotAutoIncrement() throws Exception {
		try (Connection conn = dataSource.getConnection();
		     PreparedStatement ps = conn.prepareStatement(
				     "SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA "
						     + "FROM information_schema.COLUMNS "
						     + "WHERE TABLE_SCHEMA = DATABASE() "
						     + "AND TABLE_NAME = 'exam_records' AND COLUMN_NAME = 'id'");
		     ResultSet rs = ps.executeQuery()) {
			
			assertTrue(rs.next(), "exam_records.id 列不存在");
			assertEquals("bigint", rs.getString("COLUMN_TYPE").toLowerCase(), "id 列不是 bigint，雪花会溢出");
			assertEquals("NO", rs.getString("IS_NULLABLE"));
			assertNull(rs.getString("COLUMN_DEFAULT"), "id 列不该有默认值");
			
			String extra = rs.getString("EXTRA");
			assertNotNull(extra);
			assertFalse(extra.toLowerCase().contains("auto_increment"),
					"id 列还是 auto_increment（EXTRA=" + extra + "）");
		}
	}
	
	private int firstPaperId() throws Exception {
		try (Connection conn = dataSource.getConnection();
		     Statement st = conn.createStatement();
		     ResultSet rs = st.executeQuery("SELECT id FROM paper ORDER BY id LIMIT 1")) {
			assertTrue(rs.next(), "库里一张试卷都没有，没法新建考试记录");
			return rs.getInt(1);
		}
	}
}
