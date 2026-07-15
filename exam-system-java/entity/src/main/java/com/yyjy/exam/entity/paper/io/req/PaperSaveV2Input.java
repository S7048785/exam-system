package com.yyjy.exam.entity.paper.io.req;

public record PaperSaveV2Input(
    String name,
    String description,
    int duration,
    Long categoryId
) {}
