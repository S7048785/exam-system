package com.yyjy.exam.question.common;

import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.event.AnalysisEventListener;
import com.yyjy.exam.entity.question.dto.QuestionImportView;
import com.yyjy.exam.entity.question.entity.QuestionDifficulty;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.question.bo.QuestionExcelTemplateBo;

import java.util.ArrayList;
import java.util.List;

public class QuestionExcelListener extends AnalysisEventListener<QuestionExcelTemplateBo> {
	
	private final List<QuestionImportView> datas = new ArrayList<>();
	private final List<String> errors = new ArrayList<>();
	
	@Override
	public void invoke(QuestionExcelTemplateBo data, AnalysisContext context) {
		List<String> validationErrors = validateData(datas.size() + 1, data.getContent(), data.getType(), data.getAnswer(), data.getMultiple());
		if (!validationErrors.isEmpty()) {
			errors.addAll(validationErrors);
			return;
		}
		
		QuestionImportView question = new QuestionImportView();
		question.setTitle(data.getContent());
		question.setType(QuestionType.valueOf(data.getType()));
		question.setCategoryId(Long.parseLong(data.getCategoryId()));
		question.setDifficulty(QuestionDifficulty.valueOf(data.getDifficulty()));
		question.setScore(parseIntOrDefault(data.getScore()));
		question.setAnalysis(data.getAnalysis());
		question.setAnswer(data.getAnswer());
		
		if (QuestionType.SINGLE_CHOICE.toString().equals(data.getType()) || QuestionType.MULTIPLE_CHOICE.toString().equals(data.getType())) {
			String[] choiceContents = {data.getChoiceA(), data.getChoiceB(), data.getChoiceC(), data.getChoiceD()};
			String answer = data.getAnswer();
			List<QuestionImportView.TargetOf_choices> choicesList = new ArrayList<>();
			for (int i = 0; i < choiceContents.length; i++) {
				if (choiceContents[i] != null) {
					QuestionImportView.TargetOf_choices c = new QuestionImportView.TargetOf_choices();
					c.setContent(choiceContents[i]);
					c.setCorrect(answer != null && answer.contains(choiceContents[i]));
					c.setSort(i);
					choicesList.add(c);
				}
			}
			question.setChoices(choicesList);
		}
		
		datas.add(question);
	}
	
	public List<QuestionImportView> getDatas() {
		return datas;
	}
	
	public List<String> getErrors() {
		return errors;
	}
	
	@Override
	public void doAfterAllAnalysed(AnalysisContext context) {
	}
	
	private int parseIntOrDefault(String value) {
		if (value == null) return 1;
		try {
			return Integer.parseInt(value);
		} catch (NumberFormatException e) {
			return 1;
		}
	}
	
	private List<String> validateData(int row, String content, String type, String answer, String multiple) {
		List<String> errors = new ArrayList<>();
		String prefix = row + " 行数据";
		
		if (content == null || content.isBlank()) errors.add(prefix + ": 缺失题目");
		if (type == null || type.isBlank()) errors.add(prefix + ": 缺失题目类型");
		if (answer == null || answer.isBlank()) errors.add(prefix + ": 缺失答案");
		
		if (!"是".equals(multiple) && !"否".equals(multiple)) {
			errors.add(prefix + ": 选择题答案必须为是或否");
		}
		
		if (QuestionType.JUDGE.toString().equals(type)) {
			if (!"true".equals(answer) && !"false".equals(answer)) {
				errors.add(prefix + ": 判断题答案必须为true或false");
			}
		}
		
		if (QuestionType.SINGLE_CHOICE.toString().equals(type) && answer != null) {
			if (answer.length() != 1 || answer.charAt(0) < 'A' || answer.charAt(0) > 'D') {
				errors.add(prefix + ": 选择题答案只能为A-D的字母");
			}
		}
		
		if (QuestionType.MULTIPLE_CHOICE.toString().equals(type) && answer != null) {
			if (!answer.matches("^[A-D](,[A-D])+$")) {
				errors.add(prefix + ": 选择题答案只能为A-D的字母，多个答案用逗号隔开");
			}
		}
		
		return errors;
	}
}
