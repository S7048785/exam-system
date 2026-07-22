package com.yyjy.exam.entity.question.io.req;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class MultipleChoiceExtra extends QuestionExtra {
    @NotEmpty
    @Valid
    private List<ChoiceDto> choices;
}
