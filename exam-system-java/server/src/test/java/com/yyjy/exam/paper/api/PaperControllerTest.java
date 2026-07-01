package com.yyjy.exam.paper.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.paper.dto.PaperAiSaveDto;
import com.yyjy.exam.entity.paper.dto.PaperDetail;
import com.yyjy.exam.entity.paper.dto.PaperSaveInput;
import com.yyjy.exam.entity.paper.dto.PaperUpdateInput;
import com.yyjy.exam.paper.constant.PaperStatus;
import com.yyjy.exam.paper.service.PaperService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaperController.class)
@TestPropertySource(properties = "exam.exclude.path[0]=/**")
class PaperControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PaperService paperService;

    @Test
    void addPaper_success_returns200() throws Exception {
        PaperSaveInput input = new PaperSaveInput.Builder()
                .name("Test")
                .description("desc")
                .duration(60)
                .questions(Map.of("1", 5))
                .build();
        doNothing().when(paperService).addPaper(any());

        mockMvc.perform(post("/paper/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void addPaper_businessException_returns422() throws Exception {
        PaperSaveInput input = new PaperSaveInput.Builder()
                .name("Test")
                .duration(60)
                .questions(Map.of("1", 5))
                .build();
        doThrow(new BusinessException("paper: 试卷题目不能为空"))
                .when(paperService).addPaper(any());

        mockMvc.perform(post("/paper/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string("paper: 试卷题目不能为空"));
    }

    @Test
    void updatePaper_success_returns200() throws Exception {
        PaperUpdateInput input = new PaperUpdateInput.Builder()
                .id(1)
                .name("Updated")
                .duration(90)
                .questions(Map.of("1", 10, "2", 5))
                .build();
        doNothing().when(paperService).updatePaper(any());

        mockMvc.perform(put("/paper/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void updatePaper_businessException_returns422() throws Exception {
        PaperUpdateInput input = new PaperUpdateInput.Builder()
                .id(1)
                .name("Duplicate")
                .duration(90)
                .questions(Map.of())
                .build();
        doThrow(new BusinessException("paper: 试卷名称已存在"))
                .when(paperService).updatePaper(any());

        mockMvc.perform(put("/paper/update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string("paper: 试卷名称已存在"));
    }

    @Test
    void removePaper_success_returns200() throws Exception {
        doNothing().when(paperService).removePaper(1);

        mockMvc.perform(delete("/paper/remove/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void removePaper_businessException_returns422() throws Exception {
        doThrow(new BusinessException("paper: 试卷不是草稿状态"))
                .when(paperService).removePaper(1);

        mockMvc.perform(delete("/paper/remove/1"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string("paper: 试卷不是草稿状态"));
    }

    @Test
    void getPaper_success_returns200() throws Exception {
        PaperDetail detail = new PaperDetail();
        detail.setId(1);
        detail.setName("Test Paper");
        detail.setDescription("desc");
        detail.setStatus("DRAFT");
        detail.setTotalScore(100.0);
        detail.setQuestionCount(5);
        detail.setDuration(60);
        detail.setQuestions(List.of());
        when(paperService.getPaper(1)).thenReturn(detail);

        mockMvc.perform(get("/paper/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("Test Paper"));
    }

    @Test
    void getPaper_notFound_returns422() throws Exception {
        when(paperService.getPaper(999)).thenThrow(new BusinessException("paper: 试卷不存在"));

        mockMvc.perform(get("/paper/999"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string("paper: 试卷不存在"));
    }

    @Test
    void listPapers_withoutParams_returns200() throws Exception {
        when(paperService.listPapersByNameAndStatus(isNull(), isNull())).thenReturn(List.of());

        mockMvc.perform(get("/paper/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void listPapers_withParams_returns200() throws Exception {
        when(paperService.listPapersByNameAndStatus(eq("Math"), eq(PaperStatus.DRAFT)))
                .thenReturn(List.of());

        mockMvc.perform(get("/paper/list")
                        .param("name", "Math")
                        .param("status", "DRAFT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void updatePaperStatus_success_returns200() throws Exception {
        doNothing().when(paperService).updateStatus(1, "PUBLISHED");

        mockMvc.perform(post("/paper/1/status")
                        .param("status", "PUBLISHED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void updatePaperStatus_businessException_returns422() throws Exception {
        doThrow(new BusinessException("paper: 试卷状态无效"))
                .when(paperService).updateStatus(1, "INVALID");

        mockMvc.perform(post("/paper/1/status")
                        .param("status", "INVALID"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string("paper: 试卷状态无效"));
    }

    @Test
    void aiPaper_success_returns200() throws Exception {
        PaperAiSaveDto dto = new PaperAiSaveDto();
        dto.setName("AI Paper");
        dto.setDuration(60);
        dto.setRules(List.of(
                new PaperAiSaveDto.Rule("CHOICE", List.of(1L, 2L), 5, 10)
        ));
        when(paperService.aiCreatePaper(any())).thenReturn(null);

        mockMvc.perform(post("/paper/ai")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void aiPaper_businessException_returns422() throws Exception {
        PaperAiSaveDto dto = new PaperAiSaveDto();
        dto.setName("AI Paper");
        dto.setDuration(60);
        dto.setRules(List.of());
        doThrow(new BusinessException("paper: 试卷规则不能为空"))
                .when(paperService).aiCreatePaper(any());

        mockMvc.perform(post("/paper/ai")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().string("paper: 试卷规则不能为空"));
    }
}
