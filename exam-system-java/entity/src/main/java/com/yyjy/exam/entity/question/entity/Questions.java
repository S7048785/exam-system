package com.yyjy.exam.entity.question.entity;

import com.yyjy.exam.entity.paper.entity.PaperQuestion;
import org.babyfish.jimmer.sql.*;
import org.jetbrains.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.List;

@Entity
public interface Questions {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	long id();
	
	String title();
	
	QuestionType type();
	
	@JoinColumn(name = "category_id")
	@ManyToOne
	QuestionsCategories category();
	
	@IdView
	long categoryId();
	
	QuestionDifficulty difficulty();
	
	int score();
	
	@Nullable
	String analysis();
	
	@OneToMany(mappedBy = "question")
	List<PaperQuestion> paperQuestions();
	
	@OneToMany(mappedBy = "question")
	List<QuestionChoices> questionChoices();
	
	@OneToOne(mappedBy = "question")
	@Nullable
	QuestionAnswers questionAnswers();
	
	@Nullable
	LocalDateTime createTime();
	
	@Nullable
	LocalDateTime updateTime();
	
	@Column(name = "deleted_at")
	@LogicalDeleted("now")
	@Nullable
	LocalDateTime delFlag();
}
