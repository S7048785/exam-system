package com.yyjy.exam.entity.question.io.req;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXTERNAL_PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = SingleChoiceExtra.class, name = "SINGLE_CHOICE"),
        @JsonSubTypes.Type(value = MultipleChoiceExtra.class, name = "MULTIPLE_CHOICE"),
        @JsonSubTypes.Type(value = JudgeExtra.class, name = "JUDGE"),
        @JsonSubTypes.Type(value = TextExtra.class, name = "TEXT")
})
public abstract class QuestionExtra {
}
