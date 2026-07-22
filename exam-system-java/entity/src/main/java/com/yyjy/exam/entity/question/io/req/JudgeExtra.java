package com.yyjy.exam.entity.question.io.req;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class JudgeExtra extends QuestionExtra {
    @NotNull
    @Pattern(regexp = "^(true|false)$", message = "判断题答案只能为 true 或 false")
    private String answer;
}
