package com.yyjy.exam.entity.question.io.req;

import com.yyjy.exam.common.constant.MessageConstant;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class MultipleChoiceExtra extends QuestionExtra {
    @NotEmpty
    @Size(min = 2, message = MessageConstant.QUESTION_CHOICE_AT_LEAST_TWO)
    @Valid
    private List<ChoiceDto> choices;
}
