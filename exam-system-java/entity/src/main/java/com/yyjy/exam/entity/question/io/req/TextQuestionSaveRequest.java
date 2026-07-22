package com.yyjy.exam.entity.question.io.req;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public final class TextQuestionSaveRequest extends QuestionSaveRequest {
    private String answer;
}
