package com.yyjy.exam.paper.constant;

public enum PaperStatus {
    DRAFT("DRAFT"),
    PUBLISHED("PUBLISHED"),
    STOPPED("STOPPED");

    private final String value;

    PaperStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
