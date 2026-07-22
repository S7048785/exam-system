package com.yyjy.exam.entity.question.io.req;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class TextExtra extends QuestionExtra {
    private String answer;
}
