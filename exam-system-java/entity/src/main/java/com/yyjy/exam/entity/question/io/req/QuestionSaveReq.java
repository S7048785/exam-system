package com.yyjy.exam.entity.question.io.req;

import com.yyjy.exam.entity.question.entity.QuestionDifficulty;
import com.yyjy.exam.entity.question.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuestionSaveReq {
    @NotNull
    private String title;
    @NotNull
    private Long categoryId;
    private QuestionDifficulty difficulty;
    private int score;
    private String analysis;
    @NotNull
    private QuestionType type;
    @NotNull
    @Valid
    private QuestionExtra extra;
}
