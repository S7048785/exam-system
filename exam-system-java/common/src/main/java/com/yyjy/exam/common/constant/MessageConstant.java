package com.yyjy.exam.common.constant;

/**
 * 业务异常消息常量。判据：需要查库、状态机或归属权限等系统状态才能判定的提示。
 * <p>
 * 纯入参校验消息（必填、范围、格式、集合内重复）已移至 entity 模块的
 * {@code com.yyjy.exam.entity.constant.ValidationMessage}。
 */
public final class MessageConstant {

	/**
	 * 多用户改造：归属校验（requireOwnedXxx）的统一错误信息。
	 * 纯 owner 相等判断，不含 admin 分支（决策台账 #15）。
	 */
	public static final String NOT_YOUR_RESOURCE = "common: 无权操作他人的资源";
	public static final String PAPER_IS_PUBLISHED = "paper: 试卷已发布";
	public static final String PAPER_NAME_EXIST = "paper: 试卷名称已存在";
	public static final String PAPER_NOT_FOUND = "paper: 试卷不存在";
	public static final String PAPER_CATEGORY_NOT_EXIST = "paper: 试卷分类不存在";
	public static final String PAPER_ALREADY_IN_EXAM = "paper: 该试卷已被考试引用，无法删除";
	public static final String EXAM_LOGIN_REQUIRED = "exam: 该试卷要求登录后才能参加考试";
	public static final String EXAM_ATTEMPT_LIMIT_REACHED = "exam: 已达到该试卷允许的考试次数上限";
	public static final String EXAM_ATTEMPT_TIMEOUT = "exam: 本次考试已超时";
	public static final String EXAM_DETAIL_NOT_AVAILABLE_ONGOING = "exam: 考试尚未结束，暂不能查看试卷详情";
	public static final String EXAM_NOT_STARTED = "exam: 考试尚未开始";
	public static final String EXAM_RECORD_NOT_FOUND = "exam: 考试记录不存在";
	public static final String QUESTION_CATEGORY_NOT_EXIST = "question: 题目分类不存在";
	public static final String QUESTION_TYPE_NOT_EXIST = "question: 题目类型不存在";
	public static final String QUESTION_NOT_EXIST = "question: 题目不存在";
	public static final String QUESTION_EXIST = "question: 同类型下已存在同名题目";
	public static final String USER_NOT_FOUND = "user: 用户不存在";
	public static final String USER_STATUS_ABNORMAL = "user: 账号状态异常";

	private MessageConstant() {
	}
}
