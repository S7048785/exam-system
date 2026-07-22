package com.yyjy.exam.entity.paper.dto;

import com.yyjy.exam.entity.question.entity.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaperAiSaveDto {
	private String name;
	private String description;
	private int duration;
	private List<Rule> rules;
	
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Rule {
		private QuestionType type;
		private List<Long> categoryIds;
		private int count;
		private int score;
	}
}
