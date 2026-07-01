package com.yyjy.exam.question.service;

import com.yyjy.exam.common.constant.CacheConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.common.util.RedisUtil;
import com.yyjy.exam.entity.question.dto.*;
import com.yyjy.exam.entity.question.entity.CategoriesTable;
import com.yyjy.exam.entity.question.entity.Questions;
import com.yyjy.exam.entity.question.io.req.QuestionGenerateReq;
import com.yyjy.exam.question.repository.QuestionChoicesRepository;
import com.yyjy.exam.question.repository.QuestionsRepository;
import org.babyfish.jimmer.sql.Entities;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.Predicate;
import org.babyfish.jimmer.sql.ast.Selection;
import org.babyfish.jimmer.sql.ast.query.ConfigurableRootQuery;
import org.babyfish.jimmer.sql.ast.query.MutableRootQuery;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.babyfish.jimmer.sql.ast.mutation.AssociatedSaveMode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {

    @Mock
    private QuestionsRepository questionsRepository;

    @Mock
    private QuestionChoicesRepository questionChoicesRepository;

    @Mock
    private RedisUtil redisUtil;

    @Mock
    private QuestionImportService questionImportService;

    @Mock
    private QuestionGenerateService questionGenerateService;

    @Mock
    private JSqlClient sqlClient;

    private QuestionService questionService;

    @BeforeEach
    void setUp() {
        questionService = new QuestionService(questionsRepository, questionChoicesRepository,
                redisUtil, questionImportService, questionGenerateService, sqlClient);
    }

    @Test
    void save_existingQuestion_throwsException() {
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Same title")
                .type("CHOICE")
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        when(questionsRepository.existsByTypeAndTitle("CHOICE", "Same title")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> questionService.save(input));
        assertEquals("question: 同类型下已存在同名题目", ex.getMessage());
    }

    @Test
    void save_categoryNotFound_throwsException() {
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Title")
                .type("CHOICE")
                .categoryId(999L)
                .difficulty("EASY")
                .build();
        when(questionsRepository.existsByTypeAndTitle("CHOICE", "Title")).thenReturn(false);
        when(questionsRepository.existsById(999L)).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class, () -> questionService.save(input));
        assertEquals("question: 题目分类不存在", ex.getMessage());
    }

    @Test
    void save_choiceType_missingChoices_throwsException() {
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Title")
                .type("CHOICE")
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        when(questionsRepository.existsByTypeAndTitle("CHOICE", "Title")).thenReturn(false);
        when(questionsRepository.existsById(1L)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> questionService.save(input));
        assertEquals("question: 选择题选项不能为空", ex.getMessage());
    }

    @Test
    void save_singleChoice_hasMultipleAnswers_throwsException() {
        List<QuestionSaveInput.TargetOf_choices> choices = List.of(
                new QuestionSaveInput.TargetOf_choices.Builder().content("A").correct(true).sort(0).build(),
                new QuestionSaveInput.TargetOf_choices.Builder().content("B").correct(true).sort(1).build()
        );
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Title")
                .type("CHOICE")
                .multi(false)
                .categoryId(1L)
                .difficulty("EASY")
                .choices(choices)
                .build();
        when(questionsRepository.existsByTypeAndTitle("CHOICE", "Title")).thenReturn(false);
        when(questionsRepository.existsById(1L)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> questionService.save(input));
        assertEquals("question: 多选题只能有一个正确答案", ex.getMessage());
    }

    @Test
    void save_multiChoice_concatenatesAnswers() {
        List<QuestionSaveInput.TargetOf_choices> choices = List.of(
                new QuestionSaveInput.TargetOf_choices.Builder().content("A").correct(true).sort(0).build(),
                new QuestionSaveInput.TargetOf_choices.Builder().content("B").correct(false).sort(1).build(),
                new QuestionSaveInput.TargetOf_choices.Builder().content("C").correct(true).sort(2).build()
        );
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Title")
                .type("CHOICE")
                .multi(true)
                .categoryId(1L)
                .difficulty("EASY")
                .choices(choices)
                .answers(new QuestionSaveInput.TargetOf_answers.Builder().answer("").build())
                .build();
        when(questionsRepository.existsByTypeAndTitle("CHOICE", "Title")).thenReturn(false);
        when(questionsRepository.existsById(1L)).thenReturn(true);
        when(questionsRepository.save(any(QuestionSaveInput.class), any(SaveMode.class), any(AssociatedSaveMode.class)))
                .thenReturn(mock(Questions.class));

        questionService.save(input);

        ArgumentCaptor<QuestionSaveInput> captor = ArgumentCaptor.forClass(QuestionSaveInput.class);
        verify(questionsRepository).save(captor.capture(), any(SaveMode.class), any(AssociatedSaveMode.class));
        assertEquals("A,C", captor.getValue().getAnswers().getAnswer());
    }

    @Test
    void save_nonChoiceType_hasMulti_throwsException() {
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Title")
                .type("JUDGE")
                .multi(true)
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        when(questionsRepository.existsByTypeAndTitle("JUDGE", "Title")).thenReturn(false);
        when(questionsRepository.existsById(1L)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> questionService.save(input));
        assertEquals("question: 非选择题 multi属性不能为true", ex.getMessage());
    }

    @Test
    void save_choiceType_success() {
        List<QuestionSaveInput.TargetOf_choices> choices = List.of(
                new QuestionSaveInput.TargetOf_choices.Builder().content("A").correct(true).sort(0).build()
        );
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Title")
                .type("CHOICE")
                .multi(false)
                .categoryId(1L)
                .difficulty("EASY")
                .choices(choices)
                .answers(new QuestionSaveInput.TargetOf_answers.Builder().answer("").build())
                .build();
        when(questionsRepository.existsByTypeAndTitle("CHOICE", "Title")).thenReturn(false);
        when(questionsRepository.existsById(1L)).thenReturn(true);
        when(questionsRepository.save(any(QuestionSaveInput.class), eq(SaveMode.INSERT_ONLY), eq(AssociatedSaveMode.APPEND)))
                .thenReturn(mock(Questions.class));

        Questions result = questionService.save(input);

        assertNotNull(result);
        verify(questionsRepository).save(any(QuestionSaveInput.class), eq(SaveMode.INSERT_ONLY), eq(AssociatedSaveMode.APPEND));
    }

    @Test
    void save_textType_success() {
        QuestionSaveInput input = new QuestionSaveInput.Builder()
                .title("Explain X")
                .type("TEXT")
                .multi(false)
                .categoryId(1L)
                .difficulty("EASY")
                .answers(new QuestionSaveInput.TargetOf_answers.Builder().answer("explanation").build())
                .build();
        when(questionsRepository.existsByTypeAndTitle("TEXT", "Explain X")).thenReturn(false);
        when(questionsRepository.existsById(1L)).thenReturn(true);
        when(questionsRepository.save(any(QuestionSaveInput.class), eq(SaveMode.INSERT_ONLY), eq(AssociatedSaveMode.APPEND)))
                .thenReturn(mock(Questions.class));

        questionService.save(input);

        verify(questionsRepository).save(any(QuestionSaveInput.class), eq(SaveMode.INSERT_ONLY), eq(AssociatedSaveMode.APPEND));
    }

    @Test
    void update_categoryNotFound_throwsException() {
        QuestionUpdateInput input = new QuestionUpdateInput.Builder()
                .id(1L)
                .title("New")
                .categoryId(999L)
                .difficulty("EASY")
                .build();
        when(questionsRepository.existsById(999L)).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class, () -> questionService.update(input));
        assertEquals("question: 题目分类不存在", ex.getMessage());
    }

    @Test
    void update_questionNotFound_throwsException() {
        QuestionUpdateInput input = new QuestionUpdateInput.Builder()
                .id(1L)
                .title("New")
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        when(questionsRepository.existsById(1L)).thenReturn(true);
        when(questionsRepository.findById(1L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> questionService.update(input));
        assertEquals("question: 题目不存在", ex.getMessage());
    }

    @Test
    void update_duplicateTitle_throwsException() {
        Questions oldQuestion = mock(Questions.class);
        when(oldQuestion.type()).thenReturn("CHOICE");
        QuestionUpdateInput input = new QuestionUpdateInput.Builder()
                .id(1L)
                .title("Duplicate")
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        when(questionsRepository.existsById(1L)).thenReturn(true);
        when(questionsRepository.findById(1L)).thenReturn(Optional.of(oldQuestion));
        when(questionsRepository.existsByTypeAndTitle("CHOICE", "Duplicate")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> questionService.update(input));
        assertEquals("question: 同类型下已存在同名题目", ex.getMessage());
    }

    @Test
    void update_choiceType_deletesOldChoices() {
        Questions oldQuestion = mock(Questions.class);
        when(oldQuestion.type()).thenReturn("CHOICE");
        QuestionUpdateInput input = new QuestionUpdateInput.Builder()
                .id(1L)
                .title("Updated")
                .categoryId(1L)
                .difficulty("EASY")
                .build();
        when(questionsRepository.existsById(1L)).thenReturn(true);
        when(questionsRepository.findById(1L)).thenReturn(Optional.of(oldQuestion));
        when(questionsRepository.existsByTypeAndTitle("CHOICE", "Updated")).thenReturn(false);
        when(questionsRepository.save(any(QuestionUpdateInput.class), any(SaveMode.class)))
                .thenReturn(mock(Questions.class));

        questionService.update(input);

        verify(questionChoicesRepository).deleteByQuestionId(1L);
        verify(questionsRepository).save(any(QuestionUpdateInput.class), eq(SaveMode.UPDATE_ONLY));
    }

    @Test
    void remove_delegatesToRepository() {
        questionService.remove(1L);
        verify(questionsRepository).deleteById(1L);
    }

    @Test
    void getById_notFound_throwsException() {
        JSqlClient sql = mock(JSqlClient.class);
        Entities entities = mock(Entities.class);
        when(questionsRepository.sql()).thenReturn(sql);
        when(sql.getEntities()).thenReturn(entities);
        when(entities.findById(QuestionsPageView.class, 1L)).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class, () -> questionService.getById(1L));
        assertEquals("question: 题目不存在", ex.getMessage());
    }

    @Test
    void getById_success_incrementsPopularity() throws Exception {
        QuestionsPageView view = mock(QuestionsPageView.class);
        JSqlClient sql = mock(JSqlClient.class);
        Entities entities = mock(Entities.class);
        when(questionsRepository.sql()).thenReturn(sql);
        when(sql.getEntities()).thenReturn(entities);
        when(entities.findById(QuestionsPageView.class, 1L)).thenReturn(view);

        QuestionsPageView result = questionService.getById(1L);

        assertEquals(view, result);
        Thread.sleep(300);
        verify(redisUtil).zIncrementScore(CacheConstant.POPULAR_QUESTIONS_KEY, "1", 1.0);
    }

    @Test
    void importBatchExcel_emptyFile_throwsException() {
        MultipartFile file = new MockMultipartFile("file", new byte[0]);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> questionService.importBatchExcel(file));
        assertEquals("question: 文件不能为空", ex.getMessage());
    }

    @Test
    void importBatchExcel_wrongExtension_throwsException() {
        MultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "data".getBytes());
        BusinessException ex = assertThrows(BusinessException.class,
                () -> questionService.importBatchExcel(file));
        assertEquals("question: 批量导入的文件格式错误，必须是xlsx或xls格式", ex.getMessage());
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    @Test
    void generateQuestions_categoryNotFound_throwsException() {
        MutableRootQuery rootQuery = mock(MutableRootQuery.class);
        when(sqlClient.createQuery(same(CategoriesTable.$))).thenReturn(rootQuery);
        when(rootQuery.where(any(Predicate.class))).thenReturn(rootQuery);

        ConfigurableRootQuery configurableQuery = mock(ConfigurableRootQuery.class);
        when(rootQuery.select(any(Selection.class))).thenReturn(configurableQuery);
        when(configurableQuery.fetchFirstOrNull()).thenReturn(null);

        QuestionGenerateReq req = new QuestionGenerateReq(5, "CHOICE", "EASY", 999L, false);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> questionService.generateQuestions(req));
        assertEquals("question: 题目分类不存在", ex.getMessage());
    }
}
