package com.yyjy.exam.common.constant;

public final class CacheConstant {

    private CacheConstant() {
    }

    public static final String EXAM_RECORD_CACHE = "exam_record:";
    public static final String QUESTION_DETAIL_KEY = "question:detail:";
    public static final String QUESTION_CATEGORY_KEY = "question:category:";
    public static final String PAPER_DETAIL_KEY = "paper:detail:";
    public static final String EXAM_RECORD_DETAIL_KEY = "exam_record:detail:";
    public static final String POPULAR_QUESTIONS_KEY = "question:popular:";
    public static final String QUESTION_VIEW_COUNT_KEY = "question:view_count:";
    public static final int POPULAR_QUESTIONS_COUNT = 10;
    public static final long DEFAULT_EXPIRE_SECONDS = 1800;
    public static final long HOT_DATA_EXPIRE_SECONDS = 3600;
    public static final String CAPTCHA_REGISTER_KEY = "captcha:register:";
    public static final String DASHBOARD_STATS_KEY = "dashboard:stats";
}
