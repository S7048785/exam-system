package com.yyjy.exam.exam;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.exam.entity.ExamRecordStatus;
import com.yyjy.exam.entity.exam.io.req.GradeAnswerReq;
import com.yyjy.exam.entity.id.NanoIdGenerator;
import com.yyjy.exam.exam.service.ExamGradingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 人工判卷接口（{@code ExamGradingService#gradeAnswers}）三条需求的行为验证：
 * <ol>
 *   <li><b>状态</b> 未交卷（ONGOING）不给判；已判完（GRADED）可以再判（= 改分）；</li>
 *   <li><b>得分范围</b> `[0, 该题在**这张卷上**的配分]` —— 特意挑一张
 *       `paper_question.score ≠ questions.score` 的卷，证明用的是卷面配分；</li>
 *   <li><b>重算总分</b> `exam_records.score` = 该记录全部答案分数之和；</li>
 *   <li><b>推进状态</b> 还有 `score IS NULL` 的答案 ⇒ `GRADING`；判完 ⇒ `GRADED`。</li>
 * </ol>
 * <p>
 * ⚠️ 连的是 dev 档真实库。用例只**新增**一条考试记录 + 若干答案（挂在库里已有的试卷上，
 * 不建卷不建题），`@AfterEach` 按 `student_name` 前缀把这两类行清掉，不碰真实数据。
 * <p>
 * 权限走的是 `StpUtil.getLoginIdAsLong()`（试卷作者校验），非 Web 环境下用 Mockito 静态 mock
 * 顶掉登录态 —— 本用例只关心判卷口径，不关心登录。
 */
@SpringBootTest
class ExamGradeAnswerTest {
	
	private static final String NAME_PREFIX = "判卷测试-";
	
	@Autowired
	private ExamGradingService examGradingService;
	
	@Autowired
	private DataSource dataSource;
	
	@AfterEach
	void cleanUp() throws Exception {
		try (Connection conn = dataSource.getConnection();
		     Statement st = conn.createStatement()) {
			// 库里没有外键，级联靠应用层 —— 清场时也自己按顺序删
			st.executeUpdate("DELETE FROM answer_record WHERE exam_record_id IN "
					                 + "(SELECT id FROM exam_records WHERE student_name LIKE '" + NAME_PREFIX + "%')");
			st.executeUpdate("DELETE FROM exam_records WHERE student_name LIKE '" + NAME_PREFIX + "%'");
		}
	}
	
	/** 试卷上的一道题：卷面配分（`paper_question.score`）与题目分值（`questions.score`）分开存，两者可能不等 */
	private record Q(long questionId, String type, int paperScore, int questionScore) {
	}
	
	/** 一条考试记录：`id` 只用于清理/断言，调接口一律用 `publicId`（对外标识） */
	private record Rec(long id, String publicId) {
	}
	
	@Test
	@DisplayName("判卷：未交卷不给判、已判完可再判（改分）→ 按卷面配分卡上限 → 重算总分 → 推进 status")
	void gradeAnswers() throws Exception {
		long paperId = pickPaperId();
		long owner = paperOwner(paperId);
		List<Q> questions = questionsOf(paperId);
		Q text1 = questions.stream().filter(q -> "TEXT".equals(q.type())).findFirst().orElseThrow();
		Q text2 = questions.stream().filter(q -> "TEXT".equals(q.type())).skip(1).findFirst().orElseThrow();
		Q objective = questions.stream().filter(q -> !"TEXT".equals(q.type())).findFirst().orElseThrow();
		
		// 场景：客观题已由自动判分写分（= 它的卷面配分，且**分数存在 answer_record 里**），
		// 两道简答 score 为 NULL ⇒ 记录处于 GRADING，`exam_records.score` 正好等于客观题那一行
		Rec rec = insertExamRecord(paperId, owner, objective.paperScore(), ExamRecordStatus.GRADING.name());
		long examRecordId = rec.id();
		String publicId = rec.publicId();
		long answerOfObjective = insertGradedAnswer(examRecordId, objective.questionId(), "true", objective.paperScore());
		long answerOfText1 = insertAnswer(examRecordId, text1.questionId(), "第一条简答");
		long answerOfText2 = insertAnswer(examRecordId, text2.questionId(), "第二条简答");
		System.out.println("[判卷] paperId=" + paperId + " 客观题=" + objective.questionId()
				                   + "(卷面 " + objective.paperScore() + ") 已判答案行=" + answerOfObjective
				                   + "；简答题=" + text1.questionId()
				                   + "(卷面 " + text1.paperScore() + " / 题目 " + text1.questionScore() + ")"
				                   + " " + text2.questionId()
				                   + "(卷面 " + text2.paperScore() + ")");
		
		try (MockedStatic<StpUtil> stp = Mockito.mockStatic(StpUtil.class)) {
			stp.when(StpUtil::getLoginIdAsLong).thenReturn(owner);
			
			// ---- 需求 1：得分上界 = 卷面配分（不是 questions.score）----
			int overLimit = text1.paperScore() + 1;
			BusinessException ex = assertThrows(BusinessException.class,
					() -> examGradingService.gradeAnswers(publicId, List.of(new GradeAnswerReq(answerOfText1, true, overLimit))),
					"得分 " + overLimit + " 超过卷面配分 " + text1.paperScore() + "，应当 422");
			assertTrue(ex.getMessage().contains("满分"), "错误文案应点明满分上限，实际：" + ex.getMessage());
			assertNull(answerScore(answerOfText1), "被拒的请求不能写库");
			assertEquals(objective.paperScore(), examRecordScore(examRecordId), "被拒时总分不能被改动");
			assertEquals("GRADING", examRecordStatus(examRecordId));
			
			// ---- 需求 2：写回 + 重算总分；correct 与 score 各存各的（判错但给部分分）----
			examGradingService.gradeAnswers(publicId, List.of(new GradeAnswerReq(answerOfText1, false, text1.paperScore())));
			assertEquals(text1.paperScore(), answerScore(answerOfText1));
			assertEquals(0, answerCorrect(answerOfText1), "老师判「错」，is_correct 应为 0");
			assertEquals(objective.paperScore() + text1.paperScore(), examRecordScore(examRecordId),
					"总分 = 已判客观题 + 本次简答");
			
			// ---- 需求 3a：还有没判的简答 ⇒ 保持 GRADING ----
			assertEquals("GRADING", examRecordStatus(examRecordId), "还剩一条简答没判，不该置 GRADED");
			
			// ---- 需求 3b：判完最后一条 ⇒ GRADED ----
			examGradingService.gradeAnswers(publicId, List.of(
					new GradeAnswerReq(answerOfText2, true, 0),
					// 混一个不属于本场的 id：算法以库里答案为准，匹配不上就该被忽略（不报错、不影响结果）
					new GradeAnswerReq(999_999_999L, true, 5)));
			assertEquals(objective.paperScore() + text1.paperScore(), examRecordScore(examRecordId),
					"第二条判 0 分，总分不变");
			assertEquals("GRADED", examRecordStatus(examRecordId), "没有未判答案了，应推进到 GRADED");

			// ---- 允许多次判卷：已判完（GRADED）也能再判 —— 就是「改分」----
			examGradingService.gradeAnswers(publicId,
					List.of(new GradeAnswerReq(answerOfText1, false, 1)));
			assertEquals(1, answerScore(answerOfText1), "改分后答案分数应更新");
			assertEquals(0, answerCorrect(answerOfText1), "同时写回了 is_correct");
			assertEquals(objective.paperScore() + 1, examRecordScore(examRecordId),
					"总分按新分数整体重算（客观题 + 改后的简答）");
			assertEquals("GRADED", examRecordStatus(examRecordId), "没有未判答案，仍是 GRADED");
			
			// 未交卷（ONGOING）仍然不给判：答案还可能被改
			Rec ongoing = insertExamRecord(paperId, owner, 0, ExamRecordStatus.ONGOING.name());
			long ongoingRecordId = ongoing.id();
			long ongoingAnswerId = insertAnswer(ongoingRecordId, text1.questionId(), "还没交卷的答案");
			BusinessException notSubmitted = assertThrows(BusinessException.class,
					() -> examGradingService.gradeAnswers(ongoing.publicId(),
							List.of(new GradeAnswerReq(ongoingAnswerId, true, 0))),
					"ONGOING（未交卷）的记录不能判卷");
			assertTrue(notSubmitted.getMessage().contains("尚未交卷"), "实际文案：" + notSubmitted.getMessage());
		}
	}
	
	// ------------------------------------------------------------------ 建 fixture / 断言取数
	
	/** 挑一张「≥2 道简答 + ≥1 道客观」的卷：用例要演示「判一条仍 GRADING → 再判一条 GRADED」 */
	private long pickPaperId() throws Exception {
		try (Connection conn = dataSource.getConnection();
		     Statement st = conn.createStatement();
		     ResultSet rs = st.executeQuery(
				     // ⚠️ 必须 join `paper`：库里没有外键，`paper_question` 里留着已删试卷的孤儿行
				     // （paper_id=9 就是），只查 paper_question 会挑到一张不存在的卷
				     "SELECT pq.paper_id FROM paper_question pq "
						     + "JOIN paper p ON p.id = pq.paper_id "
						     + "JOIN questions q ON q.id = pq.question_id "
						     + "GROUP BY pq.paper_id "
						     + "HAVING SUM(q.type = 'TEXT') >= 2 AND SUM(q.type <> 'TEXT') >= 1 "
						     + "ORDER BY pq.paper_id LIMIT 1")) {
			assertTrue(rs.next(), "库里找不到「2 道简答 + 1 道客观」的试卷，建不出判卷用例");
			return rs.getLong(1);
		}
	}
	
	private long paperOwner(long paperId) throws Exception {
		try (Connection conn = dataSource.getConnection();
		     PreparedStatement ps = conn.prepareStatement("SELECT user_id FROM paper WHERE id = ?")) {
			ps.setLong(1, paperId);
			try (ResultSet rs = ps.executeQuery()) {
				assertTrue(rs.next(), "试卷不存在：" + paperId);
				return rs.getLong(1);
			}
		}
	}
	
	private List<Q> questionsOf(long paperId) throws Exception {
		List<Q> rows = new ArrayList<>();
		try (Connection conn = dataSource.getConnection();
		     PreparedStatement ps = conn.prepareStatement(
				     "SELECT pq.question_id, q.type, pq.score AS paper_score, q.score AS question_score "
						     + "FROM paper_question pq JOIN questions q ON q.id = pq.question_id "
						     + "WHERE pq.paper_id = ?")) {
			ps.setLong(1, paperId);
			try (ResultSet rs = ps.executeQuery()) {
				while (rs.next()) {
					rows.add(new Q(rs.getLong("question_id"), rs.getString("type"),
							rs.getInt("paper_score"), rs.getInt("question_score")));
				}
			}
		}
		assertTrue(rows.size() >= 3, "试卷 " + paperId + " 的题目不够，建不出用例");
		return rows;
	}
	
	/** 建一条考试记录：status 传 {@code GRADING} 就是「客观题已判、简答待判」的场景 */
	private Rec insertExamRecord(long paperId, long userId, int objectiveScore, String status) throws Exception {
		LocalDateTime now = LocalDateTime.now();
		String publicId = NanoIdGenerator.next();
		try (Connection conn = dataSource.getConnection();
		     PreparedStatement ps = conn.prepareStatement(
				     "INSERT INTO exam_records(public_id, user_id, paper_id, student_name, score, start_time, end_time, status, window_switches) "
						     + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)",
				     Statement.RETURN_GENERATED_KEYS)) {
			ps.setString(1, publicId);
			ps.setLong(2, userId);
			ps.setLong(3, paperId);
			ps.setString(4, NAME_PREFIX + System.currentTimeMillis());
			ps.setInt(5, objectiveScore);
			ps.setObject(6, now);
			ps.setObject(7, now);
			ps.setString(8, status);
			ps.executeUpdate();
			try (ResultSet keys = ps.getGeneratedKeys()) {
				assertTrue(keys.next(), "没拿到新考试记录的 id");
				return new Rec(keys.getLong(1), publicId);
			}
		}
	}
	
	/** 建一条「还没判」的答案（score / is_correct 都留 NULL） */
	private long insertAnswer(long examRecordId, long questionId, String userAnswer) throws Exception {
		try (Connection conn = dataSource.getConnection();
		     PreparedStatement ps = conn.prepareStatement(
				     // ⚠️ NULL 必须**显式写出来**：`score int unsigned` 虽然可空，但没有 DEFAULT 子句，
				     // 本机 MySQL 是 STRICT_TRANS_TABLES，省略该列直接 ERROR 1364
				     // （Jimmer 那边是显式写 NULL 的，所以生产代码 saveAnswers 不受影响）
				     "INSERT INTO answer_record(exam_record_id, question_id, user_answer, score, is_correct) "
						     + "VALUES (?, ?, ?, NULL, NULL)",
				     Statement.RETURN_GENERATED_KEYS)) {
			ps.setLong(1, examRecordId);
			ps.setLong(2, questionId);
			ps.setString(3, userAnswer);
			ps.executeUpdate();
			try (ResultSet keys = ps.getGeneratedKeys()) {
				assertTrue(keys.next(), "没拿到新答案的 id");
				return keys.getLong(1);
			}
		}
	}
	
	/**
	 * 建一条**已判**的答案：模拟自动判分写完的客观题
	 * （分数存在这一行里，`exam_records.score` 只是它和简答题行的合计）。
	 */
	private long insertGradedAnswer(long examRecordId, long questionId, String userAnswer, int score) throws Exception {
		try (Connection conn = dataSource.getConnection();
		     PreparedStatement ps = conn.prepareStatement(
				     "INSERT INTO answer_record(exam_record_id, question_id, user_answer, score, is_correct) "
						     + "VALUES (?, ?, ?, ?, ?)",
				     Statement.RETURN_GENERATED_KEYS)) {
			ps.setLong(1, examRecordId);
			ps.setLong(2, questionId);
			ps.setString(3, userAnswer);
			ps.setInt(4, score);
			ps.setInt(5, score > 0 ? 1 : 0);
			ps.executeUpdate();
			try (ResultSet keys = ps.getGeneratedKeys()) {
				assertTrue(keys.next(), "没拿到新答案的 id");
				return keys.getLong(1);
			}
		}
	}
	
	private Integer answerScore(long answerRecordId) throws Exception {
		return queryInt("SELECT score FROM answer_record WHERE id = ?", answerRecordId);
	}
	
	private Integer answerCorrect(long answerRecordId) throws Exception {
		return queryInt("SELECT is_correct FROM answer_record WHERE id = ?", answerRecordId);
	}
	
	private Integer examRecordScore(long examRecordId) throws Exception {
		return queryInt("SELECT score FROM exam_records WHERE id = ?", examRecordId);
	}
	
	private String examRecordStatus(long examRecordId) throws Exception {
		try (Connection conn = dataSource.getConnection();
		     PreparedStatement ps = conn.prepareStatement(
				     "SELECT status FROM exam_records WHERE id = ?")) {
			ps.setLong(1, examRecordId);
			try (ResultSet rs = ps.executeQuery()) {
				assertTrue(rs.next(), "考试记录不存在：" + examRecordId);
				return rs.getString(1);
			}
		}
	}
	
	private Integer queryInt(String sql, long id) throws Exception {
		try (Connection conn = dataSource.getConnection();
		     PreparedStatement ps = conn.prepareStatement(sql)) {
			ps.setLong(1, id);
			try (ResultSet rs = ps.executeQuery()) {
				assertTrue(rs.next(), "查不到：" + sql + " id=" + id);
				int value = rs.getInt(1);
				return rs.wasNull() ? null : value;
			}
		}
	}
}
