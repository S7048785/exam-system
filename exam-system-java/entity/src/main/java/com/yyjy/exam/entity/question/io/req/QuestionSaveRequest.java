package com.yyjy.exam.entity.question.io.req;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.yyjy.exam.entity.question.entity.QuestionDifficulty;
import com.yyjy.exam.entity.question.entity.QuestionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
		@JsonSubTypes.Type(value = SingleChoiceQuestionSaveRequest.class, name = "SINGLE_CHOICE"),
		@JsonSubTypes.Type(value = MultipleChoiceQuestionSaveRequest.class, name = "MULTIPLE_CHOICE"),
		@JsonSubTypes.Type(value = JudgeQuestionSaveRequest.class, name = "JUDGE"),
		@JsonSubTypes.Type(value = TextQuestionSaveRequest.class, name = "TEXT")
})
public sealed abstract class QuestionSaveRequest
		permits SingleChoiceQuestionSaveRequest,
				        MultipleChoiceQuestionSaveRequest,
				        JudgeQuestionSaveRequest,
				        TextQuestionSaveRequest {
	
	@NotNull
	private String title;
	@NotNull
	private Long categoryId;
	private QuestionDifficulty difficulty;
	private int score;
	private String analysis;
	
	public final QuestionType getQuestionType() {
		return switch (this) {
			case SingleChoiceQuestionSaveRequest ignored -> QuestionType.SINGLE_CHOICE;
			case MultipleChoiceQuestionSaveRequest ignored -> QuestionType.MULTIPLE_CHOICE;
			case JudgeQuestionSaveRequest ignored -> QuestionType.JUDGE;
			default -> QuestionType.TEXT;
		};
	}
}
