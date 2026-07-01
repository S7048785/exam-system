package com.yyjy.exam.question.common;

import com.yyjy.exam.entity.question.dto.QuestionImportView;
import com.yyjy.exam.question.bo.QuestionExcelTemplateBo;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class QuestionExcelListenerTest {

    @Test
    void invoke_validChoiceData_parsesSuccessfully() {
        QuestionExcelListener listener = new QuestionExcelListener();
        QuestionExcelTemplateBo row = QuestionExcelTemplateBo.builder()
                .content("What is Java?")
                .type("CHOICE")
                .multiple("否")
                .categoryId("1")
                .difficulty("EASY")
                .score("5")
                .choiceA("A language")
                .choiceB("A drink")
                .choiceC("A car")
                .choiceD("A animal")
                .answer("A")
                .analysis("Java is a programming language")
                .build();

        listener.invoke(row, null);

        List<String> errors = listener.getErrors();
        List<QuestionImportView> datas = listener.getDatas();
        assertTrue(errors.isEmpty());
        assertEquals(1, datas.size());
        QuestionImportView data = datas.get(0);
        assertEquals("What is Java?", data.getTitle());
        assertEquals("CHOICE", data.getType());
        assertFalse(data.getMulti());
        assertEquals(1L, data.getCategoryId());
        assertEquals("EASY", data.getDifficulty());
        assertEquals(5, data.getScore());
        assertEquals("A", data.getAnswer());
        assertEquals("Java is a programming language", data.getAnalysis());
    }

    @Test
    void invoke_validJudgeData_parsesSuccessfully() {
        QuestionExcelListener listener = new QuestionExcelListener();
        QuestionExcelTemplateBo row = QuestionExcelTemplateBo.builder()
                .content("Is Java OOP?")
                .type("JUDGE")
                .multiple("否")
                .categoryId("1")
                .difficulty("EASY")
                .answer("true")
                .build();

        listener.invoke(row, null);

        assertTrue(listener.getErrors().isEmpty());
        assertEquals(1, listener.getDatas().size());
        assertEquals("true", listener.getDatas().get(0).getAnswer());
    }

    @Test
    void invoke_missingContent_addsError() {
        QuestionExcelListener listener = new QuestionExcelListener();
        QuestionExcelTemplateBo row = QuestionExcelTemplateBo.builder()
                .type("CHOICE")
                .multiple("否")
                .categoryId("1")
                .difficulty("EASY")
                .answer("A")
                .build();

        listener.invoke(row, null);

        assertFalse(listener.getErrors().isEmpty());
        assertTrue(listener.getErrors().get(0).contains("缺失题目"));
        assertTrue(listener.getDatas().isEmpty());
    }

    @Test
    void invoke_missingType_addsError() {
        QuestionExcelListener listener = new QuestionExcelListener();
        QuestionExcelTemplateBo row = QuestionExcelTemplateBo.builder()
                .content("content")
                .multiple("否")
                .categoryId("1")
                .difficulty("EASY")
                .answer("A")
                .build();

        listener.invoke(row, null);

        assertFalse(listener.getErrors().isEmpty());
        assertTrue(listener.getErrors().get(0).contains("缺失题目类型"));
    }

    @Test
    void invoke_invalidMultiple_addsError() {
        QuestionExcelListener listener = new QuestionExcelListener();
        QuestionExcelTemplateBo row = QuestionExcelTemplateBo.builder()
                .content("content")
                .type("CHOICE")
                .multiple("maybe")
                .categoryId("1")
                .difficulty("EASY")
                .answer("A")
                .build();

        listener.invoke(row, null);

        assertFalse(listener.getErrors().isEmpty());
        assertTrue(listener.getErrors().get(0).contains("必须为是或否"));
    }

    @Test
    void invoke_judgeType_invalidAnswer_addsError() {
        QuestionExcelListener listener = new QuestionExcelListener();
        QuestionExcelTemplateBo row = QuestionExcelTemplateBo.builder()
                .content("content")
                .type("JUDGE")
                .multiple("否")
                .categoryId("1")
                .difficulty("EASY")
                .answer("yes")
                .build();

        listener.invoke(row, null);

        assertFalse(listener.getErrors().isEmpty());
        assertTrue(listener.getErrors().get(0).contains("答案必须为true或false"));
    }

    @Test
    void invoke_multiChoiceSingleAnswer_addsError() {
        QuestionExcelListener listener = new QuestionExcelListener();
        QuestionExcelTemplateBo row = QuestionExcelTemplateBo.builder()
                .content("content")
                .type("CHOICE")
                .multiple("是")
                .categoryId("1")
                .difficulty("EASY")
                .choiceA("A")
                .answer("A")
                .build();

        listener.invoke(row, null);

        assertFalse(listener.getErrors().isEmpty());
        assertTrue(listener.getErrors().get(0).contains("多个答案用逗号隔开"));
    }

    @Test
    void invoke_choiceType_parsesChoices() {
        QuestionExcelListener listener = new QuestionExcelListener();
        QuestionExcelTemplateBo row = QuestionExcelTemplateBo.builder()
                .content("content")
                .type("CHOICE")
                .multiple("否")
                .categoryId("1")
                .difficulty("EASY")
                .choiceA("A")
                .choiceB("B")
                .choiceC("C")
                .answer("A")
                .build();

        listener.invoke(row, null);

        assertTrue(listener.getErrors().isEmpty());
        QuestionImportView data = listener.getDatas().get(0);
        assertNotNull(data.getChoices());
        assertEquals(3, data.getChoices().size());
        assertEquals("A", data.getChoices().get(0).getContent());
        assertEquals("B", data.getChoices().get(1).getContent());
        assertEquals("C", data.getChoices().get(2).getContent());
        assertTrue(data.getChoices().get(0).getCorrect());
        assertFalse(data.getChoices().get(1).getCorrect());
    }

    @Test
    void invoke_nonChoiceType_noChoices() {
        QuestionExcelListener listener = new QuestionExcelListener();
        QuestionExcelTemplateBo row = QuestionExcelTemplateBo.builder()
                .content("content")
                .type("JUDGE")
                .multiple("否")
                .categoryId("1")
                .difficulty("EASY")
                .answer("true")
                .build();

        listener.invoke(row, null);

        assertTrue(listener.getErrors().isEmpty());
        assertNull(listener.getDatas().get(0).getChoices());
    }
}
