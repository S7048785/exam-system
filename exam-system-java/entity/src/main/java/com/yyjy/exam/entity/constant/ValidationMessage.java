package com.yyjy.exam.entity.constant;

/**
 * 入参校验消息常量。校验消息跟随 DTO 走，因此落在 entity 模块。
 * <p>
 * 判据：不依赖数据库状态、纯入参自校验的提示（必填、范围、格式、集合内重复）。
 * 需要查库、状态机或归属权限才能判定的提示属业务异常消息，见 common 的
 * {@code com.yyjy.exam.common.constant.MessageConstant}。
 */
public final class ValidationMessage {

	public static final String PAPER_MAX_ATTEMPTS_INVALID = "paper: 考试次数上限必须大于 0";
	public static final String PAPER_PARTICIPATE_MODE_REQUIRED = "paper: 请选择考生参与方式";
	public static final String PAPER_QUESTION_EMPTY = "paper: 试卷题目不能为空";
	public static final String PAPER_QUESTION_DUPLICATE = "paper: 题目不能重复";
	public static final String PAPER_RULE_EMPTY = "paper: 试卷规则不能为空";
	public static final String PAPER_TIME_WINDOW_REQUIRED = "paper: 请填写考试开始与截止时间";
	public static final String PAPER_TIME_WINDOW_INVALID = "paper: 考试截止时间不能早于开始时间";
	public static final String QUESTION_NOT_EMPTY = "question: 题目不能为空";
	public static final String QUESTION_CHOICE_CHOICES_NOT_EMPTY = "question: 选择题选项不能为空";
	public static final String QUESTION_CHOICE_AT_LEAST_TWO = "question: 选择题至少需要两个选项";
	public static final String QUESTION_CHOICE_MULTI_NOT_EMPTY = "question: 非选择题 multi属性不能为true";
	public static final String QUESTION_CHOICE_MULTI_ANSWER_NOT_EMPTY = "question: 多选题只能有一个正确答案";
	public static final String FILE_FORMAT_ERROR = "question: 批量导入的文件格式错误，必须是xlsx或xls格式";
	public static final String FILE_NOT_EMPTY = "question: 文件不能为空";
	/**
	 * 免登录考试的考生姓名：**可以为 null**（账号登录考试不传），
	 * 但只要传了就必须是 1~50 个字符（对齐 `exam_records.student_name varchar(50)`）。
	 */
	public static final String EXAM_STUDENT_NAME_INVALID = "exam: 学生姓名长度在1到50个字符之间";

	private ValidationMessage() {
	}
}
