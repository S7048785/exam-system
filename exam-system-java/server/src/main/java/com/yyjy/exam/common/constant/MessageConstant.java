package com.yyjy.exam.common.constant;

public final class MessageConstant {

    private MessageConstant() {
    }

    public static final String PAPER_STATUS_INVALID = "paper: 试卷状态无效";
    public static final String PAPER_NOT_DRAFT_STATUS = "paper: 试卷不是草稿状态";
    public static final String PAPER_NAME_EXIST = "paper: 试卷名称已存在";
    public static final String PAPER_RULE_EMPTY = "paper: 试卷规则不能为空";
    public static final String PAPER_QUESTION_EMPTY = "paper: 试卷题目不能为空";
    public static final String PAPER_NOT_FOUND = "paper: 试卷不存在";
    public static final String PAPER_ALREADY_IN_EXAM = "paper: 该试卷已被考试引用，无法删除";
    public static final String QUESTION_CATEGORY_NOT_EXIST = "question: 题目分类不存在";
    public static final String QUESTION_NOT_EMPTY = "question: 题目不能为空";
    public static final String QUESTION_TYPE_NOT_EXIST = "question: 题目类型不存在";
    public static final String QUESTION_NOT_EXIST = "question: 题目不存在";
    public static final String QUESTION_EXIST = "question: 同类型下已存在同名题目";
    public static final String QUESTION_CHOICE_CHOICES_NOT_EMPTY = "question: 选择题选项不能为空";
    public static final String QUESTION_CHOICE_MULTI_NOT_EMPTY = "question: 非选择题 multi属性不能为true";
    public static final String QUESTION_CHOICE_MULTI_ANSWER_NOT_EMPTY = "question: 多选题只能有一个正确答案";
    public static final String FILE_FORMAT_ERROR = "question: 批量导入的文件格式错误，必须是xlsx或xls格式";
    public static final String FILE_NOT_EMPTY = "question: 文件不能为空";
}
