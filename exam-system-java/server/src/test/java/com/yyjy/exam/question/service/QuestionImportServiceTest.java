package com.yyjy.exam.question.service;

import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.question.dto.QuestionImportInput;
import com.yyjy.exam.entity.question.entity.CategoriesTable;
import com.yyjy.exam.question.repository.QuestionsRepository;

import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.Predicate;
import org.babyfish.jimmer.sql.ast.Selection;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.ast.query.ConfigurableRootQuery;
import org.babyfish.jimmer.sql.ast.query.MutableRootQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuestionImportServiceTest {

    @Mock
    private QuestionsRepository questionsRepository;

    @Mock
    private JSqlClient sqlClient;

    private QuestionImportService questionImportService;

    @BeforeEach
    void setUp() {
        questionImportService = new QuestionImportService(questionsRepository, sqlClient);
    }

    @Test
    void importBatch_emptyList_throwsException() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> questionImportService.importBatch(List.of()));
        assertEquals("question: 题目不能为空", ex.getMessage());
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    @Test
    void importBatch_categoryNotFound_throwsException() {
        MutableRootQuery rootQuery = mock(MutableRootQuery.class);
        when(sqlClient.createQuery(same(CategoriesTable.$))).thenReturn(rootQuery);
        when(rootQuery.where(any(Predicate.class))).thenReturn(rootQuery);

        ConfigurableRootQuery configurableQuery = mock(ConfigurableRootQuery.class);
        when(rootQuery.select(any(Selection.class))).thenReturn(configurableQuery);
        when(configurableQuery.execute()).thenReturn(List.of());

        QuestionImportInput input = new QuestionImportInput.Builder()
                .title("Test question")
                .type("JUDGE")
                .categoryId(999L)
                .difficulty("EASY")
                .answer("true")
                .build();

        BusinessException ex = assertThrows(BusinessException.class,
                () -> questionImportService.importBatch(List.of(input)));
        assertTrue(ex.getMessage().contains("question: 题目分类不存在"));
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    @Test
    void importBatch_success() {
        MutableRootQuery rootQuery = mock(MutableRootQuery.class);
        when(sqlClient.createQuery(same(CategoriesTable.$))).thenReturn(rootQuery);
        when(rootQuery.where(any(Predicate.class))).thenReturn(rootQuery);

        ConfigurableRootQuery configurableQuery = mock(ConfigurableRootQuery.class);
        when(rootQuery.select(any(Selection.class))).thenReturn(configurableQuery);
        when(configurableQuery.execute()).thenReturn(List.of(1L));

        QuestionImportInput input = new QuestionImportInput.Builder()
                .title("Test question")
                .type("JUDGE")
                .categoryId(1L)
                .difficulty("EASY")
                .answer("true")
                .build();

        String result = questionImportService.importBatch(List.of(input));

        assertEquals("批量导入成功: 1/1", result);
        verify(questionsRepository).save(any(com.yyjy.exam.entity.question.entity.Questions.class), eq(SaveMode.INSERT_ONLY), eq(AssociatedSaveMode.APPEND));
    }
}
