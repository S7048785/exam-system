package com.yyjy.exam.question.service;

import com.yyjy.exam.common.constant.PromptConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.entity.QuestionDifficulty;
import com.yyjy.exam.entity.question.entity.QuestionType;
import com.yyjy.exam.entity.question.io.res.QuestionGenerateDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionGenerateService {
	
	private static final Logger log = LoggerFactory.getLogger(QuestionGenerateService.class);
	
	private final ChatClient.Builder chatClientBuilder;
	
	public QuestionGenerateService(ChatClient.Builder chatClientBuilder) {
		this.chatClientBuilder = chatClientBuilder;
	}
	
	public List<QuestionGenerateDto> generateQuestions(
			String category,
			int count,
			QuestionDifficulty difficulty,
			QuestionType type,
			Boolean includeMultiple
	) {
		String typeDesc;
		if (includeMultiple != null) {
			typeDesc = includeMultiple ? "选择题(包含单选和多选)" : "选择题(仅单选)";
		} else if (QuestionType.JUDGE.equals(type)) {
			typeDesc = "判断题(**重要：判断题答案只能是true或false，确保正确答案和错误答案的数量大致平衡，不能全部是true或false**)";
		} else if (QuestionType.TEXT.equals(type)) {
			typeDesc = "简答题";
		} else {
			typeDesc = "选择题";
		}
		
		String extraReq = generateExtraRequirements(type);
		
		String difficultyDesc = switch (difficulty) {
			case QuestionDifficulty.EASY -> "简单";
			case QuestionDifficulty.HARD -> "困难";
			case QuestionDifficulty.MEDIUM -> "中等";
		};
		
		ChatClient chatClient = chatClientBuilder
				                        .defaultSystem(PromptConstant.QUESTION_GENERATE_SYSTEM_PROMPT)
				                        .build();
		
		long startTime = System.currentTimeMillis();
		var chatResponse = chatClient.prompt()
				                   .user(userSpec -> userSpec
						                                     .text(PromptConstant.QUESTION_GENERATE_USER_PROMPT)
						                                     .param("category", category)
						                                     .param("count", count)
						                                     .param("difficulty", difficultyDesc)
						                                     .param("type", typeDesc)
						                                     .param("extraReq", extraReq))
				                   .call()
				                   .chatResponse();
		long endTime = System.currentTimeMillis();
		
		if (chatResponse == null || chatResponse.getResult() == null || chatResponse.getResult().getOutput() == null) {
			throw new BusinessException("AI 响应为空");
		}
		
		logAiMetrics(chatResponse, endTime - startTime);
		
		try {
			BeanOutputConverter<List<QuestionGenerateDto>> converter =
					new BeanOutputConverter<>(new ParameterizedTypeReference<>() {
					});
			String text = chatResponse.getResult().getOutput().getText();
			if (text != null) {
				return converter.convert(text);
			}
			throw new BusinessException("AI 响应为空");
		} catch (Exception e) {
			log.error("JSON 解析失败", e);
			throw new BusinessException("生成题目解析失败");
		}
	}
	
	private String generateExtraRequirements(QuestionType type) {
		return switch (type) {
			case SINGLE_CHOICE, MULTIPLE_CHOICE -> PromptConstant.QUESTION_CHOICE_GENERATE_USER_PROMPT;
			case JUDGE -> PromptConstant.QUESTION_JUDGE_GENERATE_USER_PROMPT;
			case TEXT -> PromptConstant.QUESTION_TEXT_GENERATE_USER_PROMPT;
		};
	}
	
	private void logAiMetrics(org.springframework.ai.chat.model.ChatResponse response, long duration) {
		var usage = response.getMetadata().getUsage();
		log.info("--- AI 调用报告 ---\n响应内容摘要: {}\n模型: {}\n耗时: {}ms\nToken: 输入 {} / 输出 {} / 总计 {}",
				response.getResult().getOutput().getText(),
				response.getMetadata().getModel(),
				duration,
				usage.getPromptTokens(),
				usage.getCompletionTokens(),
				usage.getTotalTokens());
	}
}
