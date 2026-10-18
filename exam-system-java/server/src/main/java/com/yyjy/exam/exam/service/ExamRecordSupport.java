package com.yyjy.exam.exam.service;

import cn.dev33.satoken.stp.StpUtil;
import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.exam.entity.ExamRecords;
import com.yyjy.exam.entity.paper.entity.PaperTable;
import com.yyjy.exam.exam.repository.ExamRecordsRepository;
import lombok.RequiredArgsConstructor;
import org.babyfish.jimmer.sql.ast.tuple.Tuple2;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * `exam_records` 的**共享地基**：记录存在性 + 归属校验 —— 考生侧与控制台侧都要用。
 * 本类**不带事务**、也不做业务判断，只负责「查 + 校验 + 抛 422」，事务边界交给调用方。
 */
@RequiredArgsConstructor
@Component
public class ExamRecordSupport {
	
	private final ExamRecordsRepository examRecordsRepo;
	
	/**
	 * 考试记录归属校验（多用户改造，决策台账 Q5 的收口形态）。
	 */
	public void assertOwned(ExamRecords record) {
		Long ownerId = record.userId();
		if (ownerId == null) {
			return;
		}
		
		long me;
		try {
			me = StpUtil.getLoginIdAsLong();
		} catch (Exception e) {
			throw new BusinessException(MessageConstant.NOT_YOUR_RESOURCE);
		}
		if (ownerId != me) {
			throw new BusinessException(MessageConstant.NOT_YOUR_RESOURCE);
		}
	}
	
	/**
	 * 按对外短码查找，不存在时抛异常（对外接口一律用 `publicId`，自增 id 不出现在路径里）。
	 */
	public ExamRecords findRecordOrThrow(String publicId) {
		return examRecordsRepo.findByPublicId(publicId)
				       .orElseThrow(() -> new BusinessException("考试记录不存在"));
	}
	
	/**
	 * 控制台侧归属校验：试卷必须存在且属于当前登录用户，否则 422
	 * （不存在 → `PAPER_NOT_FOUND`；非本人 → `NOT_YOUR_RESOURCE`）。
	 * <p>
	 * 返回卷面总分（一次查询顺手带回，别为它再查一遍）；成绩统计用不上返回值，
	 * 只借用这里的校验，故调用处可忽略。
	 */
	public int requireOwnedPaper(long paperId) {
		long me = StpUtil.getLoginIdAsLong();
		PaperTable paper = PaperTable.$;
		List<Tuple2<Long, Integer>> owners = examRecordsRepo.sql().createQuery(paper)
				                                     .where(paper.id().eq(paperId))
				                                     .select(paper.userId(), paper.totalScore())
				                                     .execute();
		if (owners.isEmpty()) {
			throw new BusinessException(MessageConstant.PAPER_NOT_FOUND);
		}
		Tuple2<Long, Integer> owner = owners.getFirst();
		if (owner.get_1() != me) {
			throw new BusinessException(MessageConstant.NOT_YOUR_RESOURCE);
		}
		return owner.get_2() == null ? 0 : owner.get_2();
	}
}
