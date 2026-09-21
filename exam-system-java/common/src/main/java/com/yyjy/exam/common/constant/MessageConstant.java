package com.yyjy.exam.common.constant;

public final class MessageConstant {
	
	/**
	 * 多用户改造：归属校验（requireOwnedXxx）的统一错误信息。
	 * 纯 owner 相等判断，不含 admin 分支（决策台账 #15）。
	 */
	public static final String NOT_YOUR_RESOURCE = "common: 无权操作他人的资源";
	public static final String PAPER_NOT_PUBLISH = "paper: 试卷未发布";
	public static final String PAPER_IS_PUBLISHED = "paper: 试卷已发布";
	public static final String PAPER_NAME_EXIST = "paper: 试卷名称已存在";
	public static final String PAPER_RULE_EMPTY = "paper: 试卷规则不能为空";
	public static final String PAPER_QUESTION_EMPTY = "paper: 试卷题目不能为空";
	public static final String PAPER_QUESTION_DUPLICATE = "paper: 题目不能重复";
	public static final String PAPER_NOT_FOUND = "paper: 试卷不存在";
	public static final String PAPER_CATEGORY_NOT_EXIST = "paper: 试卷分类不存在";
	public static final String PAPER_TIME_WINDOW_REQUIRED = "paper: 请填写考试开始与截止时间";
	public static final String PAPER_TIME_WINDOW_INVALID = "paper: 考试截止时间不能早于开始时间";
	public static final String PAPER_MAX_ATTEMPTS_INVALID = "paper: 考试次数上限必须大于 0";
	public static final String PAPER_PARTICIPATE_MODE_REQUIRED = "paper: 请选择考生参与方式";
	public static final String PAPER_ALREADY_IN_EXAM = "paper: 该试卷已被考试引用，无法删除";
	public static final String PAPER_PUBLISHED_CANNOT_EDIT_QUESTIONS = "paper: 试卷已发布，不能修改题目";
	public static final String EXAM_LOGIN_REQUIRED = "exam: 该试卷要求登录后才能参加考试";
	public static final String EXAM_ATTEMPT_LIMIT_REACHED = "exam: 已达到该试卷允许的考试次数上限";
	public static final String EXAM_DETAIL_NOT_AVAILABLE_ONGOING = "exam: 考试尚未结束，暂不能查看试卷详情";
	public static final String EXAM_NOT_STARTED = "exam: 考试尚未开始";
	public static final String EXAM_RECORD_NOT_FOUND = "exam: 考试记录不存在";
	public static final String QUESTION_CATEGORY_NOT_EXIST = "question: 题目分类不存在";
	public static final String QUESTION_NOT_EMPTY = "question: 题目不能为空";
	public static final String QUESTION_TYPE_NOT_EXIST = "question: 题目类型不存在";
	public static final String QUESTION_NOT_EXIST = "question: 题目不存在";
	public static final String QUESTION_EXIST = "question: 同类型下已存在同名题目";
	public static final String QUESTION_CHOICE_CHOICES_NOT_EMPTY = "question: 选择题选项不能为空";
	public static final String QUESTION_CHOICE_AT_LEAST_TWO = "question: 选择题至少需要两个选项";
	public static final String QUESTION_CHOICE_MULTI_NOT_EMPTY = "question: 非选择题 multi属性不能为true";
	public static final String QUESTION_CHOICE_MULTI_ANSWER_NOT_EMPTY = "question: 多选题只能有一个正确答案";
	public static final String FILE_FORMAT_ERROR = "question: 批量导入的文件格式错误，必须是xlsx或xls格式";
	public static final String FILE_NOT_EMPTY = "question: 文件不能为空";
	
	private MessageConstant() {
	}
}
