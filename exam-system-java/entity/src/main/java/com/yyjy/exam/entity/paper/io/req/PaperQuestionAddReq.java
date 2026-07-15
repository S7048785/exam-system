package com.yyjy.exam.entity.paper.io.req;

import java.util.List;

public record PaperQuestionAddReq(
    List<Item> questions
) {
    public record Item(
        long questionId,
        double score
    ) {}
}
