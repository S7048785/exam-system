package com.yyjy.exam.entity.question.io.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChoiceDto {
    @NotBlank
    private String content;
    @NotNull
    private Boolean correct;
    private Integer sort;
}
