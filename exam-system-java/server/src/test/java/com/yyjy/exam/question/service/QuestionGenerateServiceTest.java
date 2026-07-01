package com.yyjy.exam.question.service;

import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.io.res.QuestionGenerateDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;

import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuestionGenerateServiceTest {

    @Mock
    private ChatClient.Builder chatClientBuilder;

    @Mock
    private ChatClient chatClient;

    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;

    @Mock
    private ChatClient.CallResponseSpec callResponseSpec;

    private QuestionGenerateService questionGenerateService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        lenient().when(chatClientBuilder.defaultSystem(anyString())).thenReturn(chatClientBuilder);
        lenient().when(chatClientBuilder.build()).thenReturn(chatClient);
        lenient().when(chatClient.prompt()).thenReturn(requestSpec);
        lenient().when(requestSpec.user(any(Consumer.class))).thenReturn(requestSpec);
        lenient().when(requestSpec.call()).thenReturn(callResponseSpec);

        questionGenerateService = new QuestionGenerateService(chatClientBuilder);
    }

    @Test
    void generateQuestions_nullChatResponse_throwsException() {
        when(callResponseSpec.chatResponse()).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> questionGenerateService.generateQuestions("category", 5, "EASY", "CHOICE", false));
        assertEquals("AI 响应为空", ex.getMessage());
    }

    @Test
    void generateQuestions_nullResult_throwsException() {
        ChatResponse response = mock(ChatResponse.class);
        when(response.getResult()).thenReturn(null);
        when(callResponseSpec.chatResponse()).thenReturn(response);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> questionGenerateService.generateQuestions("category", 5, "EASY", "CHOICE", false));
        assertEquals("AI 响应为空", ex.getMessage());
    }

    @Test
    void generateQuestions_success() {
        ChatResponse chatResponse = mock(ChatResponse.class);
        ChatResponseMetadata metadata = mock(ChatResponseMetadata.class);
        Usage usage = mock(Usage.class);

        String json = """
                [
                  {"title": "Q1", "type": "CHOICE", "multi": false, "difficulty": "EASY", "score": 5, "analysis": "a", "choices": ["A", "B"], "answer": "A"},
                  {"title": "Q2", "type": "JUDGE", "multi": false, "difficulty": "EASY", "score": 5, "analysis": "b", "choices": null, "answer": "true"}
                ]
                """;

        Generation generation = mock(Generation.class);
        AssistantMessage message = mock(AssistantMessage.class);

        when(callResponseSpec.chatResponse()).thenReturn(chatResponse);
        when(chatResponse.getResult()).thenReturn(generation);
        when(generation.getOutput()).thenReturn(message);
        when(message.getText()).thenReturn(json);
        when(chatResponse.getMetadata()).thenReturn(metadata);
        when(metadata.getUsage()).thenReturn(usage);

        List<QuestionGenerateDto> result = questionGenerateService.generateQuestions("Java", 2, "EASY", "CHOICE", false);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Q1", result.get(0).title());
        assertEquals("CHOICE", result.get(0).type());
        assertEquals("Q2", result.get(1).title());
        assertEquals("JUDGE", result.get(1).type());
    }

    @Test
    void generateQuestions_invalidType_throwsException() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> questionGenerateService.generateQuestions("cat", 1, "EASY", "INVALID", false));
        assertEquals("题目类型错误", ex.getMessage());
    }
}
