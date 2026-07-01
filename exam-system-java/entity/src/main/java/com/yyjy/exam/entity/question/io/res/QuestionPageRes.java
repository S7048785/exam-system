package com.yyjy.exam.entity.question.io.res;

import com.yyjy.exam.entity.question.dto.QuestionsPageView;
import lombok.Builder;

import java.util.List;

@Builder
public record QuestionPageRes(
    List<QuestionsPageView> records,
    long total,
    int current,
    int size,
    long pages
) {}
