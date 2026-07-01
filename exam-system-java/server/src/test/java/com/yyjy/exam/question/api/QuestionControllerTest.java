package com.yyjy.exam.question.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.dto.*;
import com.yyjy.exam.entity.question.io.req.QuestionGenerateReq;
import com.yyjy.exam.entity.question.io.req.QuestionListReq;
import com.yyjy.exam.entity.question.io.res.QuestionGenerateDto;
import com.yyjy.exam.entity.question.io.res.QuestionPageRes;
import com.yyjy.exam.question.service.QuestionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(QuestionController.class)
@org.springframework.test.context.TestPropertySource(properties = "exam.exclude.path[0]=/**")
class QuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private QuestionService questionService;

    @Test
    void addQuestion_success_returns200() throws Exception {
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Test")
                .type("CHOICE")
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        when(questionService.save(any())).thenReturn(null);

        mockMvc.perform(post("/question/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void addQuestion_businessException_returns422() throws Exception {
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Test")
                .type("CHOICE")
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        doThrow(new BusinessException("question: 同类型下已存在同名题目"))
                .when(questionService).save(any());

        mockMvc.perform(post("/question/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string("question: 同类型下已存在同名题目"));
    }

    @Test
    void updateQuestion_success_returns200() throws Exception {
        QuestionUpdateInput input = new QuestionUpdateInput.Builder()
                .id(1L)
                .title("Updated")
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        when(questionService.update(any())).thenReturn(null);

        mockMvc.perform(put("/question/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void updateQuestion_businessException_returns422() throws Exception {
        QuestionUpdateInput input = new QuestionUpdateInput.Builder()
                .id(1L)
                .title("Updated")
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        doThrow(new BusinessException("question: 题目不存在"))
                .when(questionService).update(any());

        mockMvc.perform(put("/question/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string("question: 题目不存在"));
    }

    @Test
    void removeQuestion_success_returns200() throws Exception {
        doNothing().when(questionService).remove(1L);

        mockMvc.perform(delete("/question/remove/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void getQuestion_success_returns200() throws Exception {
        QuestionsPageView view = mock(QuestionsPageView.class);
        when(view.getId()).thenReturn(1L);
        when(view.getTitle()).thenReturn("Test question");
        when(questionService.getById(1L)).thenReturn(view);

        mockMvc.perform(get("/question/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void getQuestion_notFound_returns422() throws Exception {
        when(questionService.getById(999L)).thenThrow(new BusinessException("question: 题目不存在"));

        mockMvc.perform(get("/question/999"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string("question: 题目不存在"));
    }

    @Test
    void listQuestions_withoutParams_returns200() throws Exception {
        QuestionPageRes pageRes = QuestionPageRes.builder()
                .records(List.of())
                .total(0)
                .current(1)
                .size(20)
                .pages(0)
                .build();
        when(questionService.list(any(QuestionListReq.class))).thenReturn(pageRes);

        mockMvc.perform(get("/question/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    void listQuestions_withParams_returns200() throws Exception {
        QuestionPageRes pageRes = QuestionPageRes.builder()
                .records(List.of())
                .total(0)
                .current(1)
                .size(10)
                .pages(0)
                .build();
        when(questionService.list(any(QuestionListReq.class))).thenReturn(pageRes);

        mockMvc.perform(get("/question/list")
                        .param("page", "1")
                        .param("size", "10")
                        .param("difficulty", "EASY")
                        .param("type", "CHOICE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void getPopularQuestions_returns200() throws Exception {
        when(questionService.getPopularQuestions(10)).thenReturn(List.of());

        mockMvc.perform(get("/question/popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void refreshPopularQuestions_returns200() throws Exception {
        doNothing().when(questionService).refreshPopularQuestions();

        mockMvc.perform(post("/question/popular/refresh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void aiGenerate_success_returns200() throws Exception {
        QuestionGenerateReq req = new QuestionGenerateReq(5, "CHOICE", "EASY", 1L, false);
        List<QuestionGenerateDto> dtos = List.of(
                new QuestionGenerateDto("Q1", "CHOICE", false, "EASY", 5, "", List.of("A", "B"), "A")
        );
        when(questionService.generateQuestions(any())).thenReturn(dtos);

        mockMvc.perform(post("/question/batch/ai-generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].title").value("Q1"));
    }

    @Test
    void importQuestions_success_returns200() throws Exception {
        QuestionImportInput input = new QuestionImportInput.Builder()
                .title("Imported")
                .type("JUDGE")
                .categoryId(1L)
                .difficulty("EASY")
                .answer("true")
                .build();
        when(questionService.importBatch(anyList())).thenReturn("批量导入成功: 1/1");

        mockMvc.perform(post("/question/batch/import-questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(input))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").value("批量导入成功: 1/1"));
    }

    @Test
    void previewExcel_success_returns200() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "dummy".getBytes());
        when(questionService.parseExcel(any())).thenReturn(List.of());

        mockMvc.perform(MockMvcRequestBuilders.multipart(HttpMethod.POST, "/question/batch/preview-excel")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void excelImportQuestions_success_returns200() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "dummy".getBytes());
        when(questionService.importBatchExcel(any())).thenReturn("批量导入成功: 1/1");

        mockMvc.perform(MockMvcRequestBuilders.multipart(HttpMethod.POST, "/question/batch/excel-import-questions")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").value("批量导入成功: 1/1"));
    }
}
