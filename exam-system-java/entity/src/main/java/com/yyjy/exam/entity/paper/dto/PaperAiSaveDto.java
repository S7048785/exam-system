package com.yyjy.exam.entity.paper.dto;

import com.yyjy.exam.entity.question.entity.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaperAiSaveDto {
	private String name;
	private String description;
	private int duration;
	
	/** 试卷分类（paper.category_id 是 NOT NULL，原来这里没传 → INSERT 必失败） */
	private Long categoryId;
	
	/** 考试时间窗（paper.start / paper.end 都是 NOT NULL 且无 DB 默认值，必须由前端传入） */
	private LocalDateTime start;
	private LocalDateTime end;
	
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
