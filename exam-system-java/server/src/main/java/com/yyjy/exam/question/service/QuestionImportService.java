package com.yyjy.exam.question.service;

import com.yyjy.exam.common.constant.MessageConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.dto.QuestionImportInput;
import com.yyjy.exam.entity.question.dto.QuestionSaveInput;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.entity.question.entity.Questions;
import com.yyjy.exam.entity.question.entity.QuestionsCategoriesTable;
import com.yyjy.exam.question.repository.QuestionsRepository;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class QuestionImportService {
	
	private final QuestionsRepository questionsRepository;
	private final JSqlClient sqlClient;
	
	public QuestionImportService(QuestionsRepository questionsRepository, JSqlClient sqlClient) {
		this.questionsRepository = questionsRepository;
		this.sqlClient = sqlClient;
	}
	
	@Transactional
	public String importBatch(List<QuestionImportInput> questions) {
		if (questions.isEmpty()) {
			throw new BusinessException(MessageConstant.QUESTION_NOT_EMPTY);
		}
		
		int okCount = 0;
		for (QuestionImportInput item : questions) {
			var ct = QuestionsCategoriesTable.$;
			boolean categoryExists = !sqlClient.createQuery(ct)
					                          .where(ct.id().eq(item.getCategoryId()))
					                          .select(ct.id())
					                          .execute()
					                          .isEmpty();
			if (!categoryExists) {
				throw new BusinessException(MessageConstant.QUESTION_CATEGORY_NOT_EXIST + " " + item.getCategoryId());
			}
			
			var saveInput = new QuestionSaveInput.Builder()
					                .title(item.getTitle())
					                .type(item.getType())
					                .categoryId(item.getCategoryId())
					                .difficulty(item.getDifficulty())
					                .score(item.getScore())
					                .analysis(item.getAnalysis());
			
			QuestionSaveInput.TargetOf_answers answers = new QuestionSaveInput.TargetOf_answers();
			answers.setAnswer(item.getAnswer() != null ? item.getAnswer() : "");
			saveInput.answers(answers);
			
			if (QuestionType.SINGLE_CHOICE.equals(item.getType()) || QuestionType.MULTIPLE_CHOICE.equals(item.getType()) && item.getChoices() != null) {
				List<QuestionSaveInput.TargetOf_choices> choices = new ArrayList<>();
				assert item.getChoices() != null;
				for (QuestionImportInput.TargetOf_choices importChoice : item.getChoices()) {
					QuestionSaveInput.TargetOf_choices choice = new QuestionSaveInput.TargetOf_choices();
					choice.setContent(importChoice.getContent());
					choice.setCorrect(importChoice.getCorrect());
					choice.setSort(importChoice.getSort());
					choices.add(choice);
				}
				saveInput.choices(choices);
			}
			Questions question = saveInput.build().toEntity();
			questionsRepository.save(question, SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND);
			okCount++;
		}
		return "批量导入成功: " + okCount + "/" + questions.size();
	}
}
