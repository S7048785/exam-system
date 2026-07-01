package com.yyjy.exam.exam.service;

import com.yyjy.exam.common.constant.PromptConstant;
import com.yyjy.exam.common.exception.BusinessException;
import com.yyjy.exam.entity.exam.entity.AnswerRecord;
import com.yyjy.exam.entity.exam.entity.AnswerRecordDraft;
import com.yyjy.exam.entity.exam.io.req.QuestionTextGradingReq;
import com.yyjy.exam.entity.exam.io.res.GradingResult;
import com.yyjy.exam.exam.repository.AnswerRecordRepository;
import org.babyfish.jimmer.sql.JSqlClient;
import org.babyfish.jimmer.sql.ast.mutation.SaveMode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class ExamBulkGradingService {

    private static final int BATCH_SIZE = 5;
    private static final Logger log = LoggerFactory.getLogger(ExamBulkGradingService.class);

    private final ChatClient.Builder chatClientBuilder;
    private final AnswerRecordRepository answerRecordRepo;
    private final JSqlClient sqlClient;
    private final ExecutorService executorService = Executors.newFixedThreadPool(5);

    public ExamBulkGradingService(ChatClient.Builder chatClientBuilder, AnswerRecordRepository answerRecordRepo, JSqlClient sqlClient) {
        this.chatClientBuilder = chatClientBuilder;
        this.answerRecordRepo = answerRecordRepo;
        this.sqlClient = sqlClient;
    }

    public void batchGrading(List<QuestionTextGradingReq> requests) {
        List<QuestionTextGradingReq> validRequests = requests.stream()
                .filter(r -> !r.userAnswer().isBlank())
                .toList();
        log.info("开始批量批阅，有效题目数量：{}", validRequests.size());

        int totalBatches = validRequests.size() / BATCH_SIZE + (validRequests.size() % BATCH_SIZE > 0 ? 1 : 0);

        for (int batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            int start = batchIndex * BATCH_SIZE;
            int end = Math.min(start + BATCH_SIZE, validRequests.size());
            List<QuestionTextGradingReq> batch = validRequests.subList(start, end);
            log.info("处理第 {}/{} 批次，本批 {} 条", batchIndex + 1, totalBatches, batch.size());
            processBatch(batch);
        }
    }

    private void processBatch(List<QuestionTextGradingReq> batch) {
        List<CompletableFuture<AnswerRecord>> futures = new ArrayList<>();
        for (QuestionTextGradingReq question : batch) {
            futures.add(CompletableFuture.supplyAsync(() -> {
                try {
                    return gradeOneQuestion(question);
                } catch (Exception e) {
                    log.error("处理答题记录 {} 时出错", question.recordId(), e);
                    throw new BusinessException("AI 批改失败");
                }
            }, executorService));
        }

        List<AnswerRecord> results = futures.stream()
                .map(CompletableFuture::join)
                .toList();
        if (!results.isEmpty()) {
            sqlClient.saveEntitiesCommand(results).setMode(SaveMode.UPDATE_ONLY).execute();
        }
    }

    private AnswerRecord gradeOneQuestion(QuestionTextGradingReq question) {
        ChatClient chatClient = chatClientBuilder.build();
        GradingResult chatResponse = chatClient.prompt()
                .user(userSpec -> userSpec
                        .text(PromptConstant.QUESTION_GRADE_USER_PROMPT)
                        .param("title", question.title())
                        .param("answer", question.answer())
                        .param("score", question.score())
                        .param("userAnswer", question.userAnswer()))
                .call()
                .entity(GradingResult.class);

        return AnswerRecordDraft.$.produce(draft -> {
            draft.setId(question.recordId());
            draft.setAiCorrection(chatResponse != null ? chatResponse.getCorrection() : null);
            draft.setScore(chatResponse != null ? chatResponse.getScore() : 0);
        });
    }
}
