package com.yyjy.service

import com.yyjy.common.BusinessException
import com.yyjy.constants.PromptConstant
import com.yyjy.models.bo.GradingResult
import com.yyjy.models.dto.QuestionTextGradingRequest
import com.yyjy.models.entity.AnswerRecord
import com.yyjy.repository.AnswerRecordRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import org.babyfish.jimmer.sql.ast.mutation.SaveMode
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Service

/**
 * @author Nyxcirea
 * @date 2026/5/2
 * @description: TODO
 */
@Service
class ExamBulkGradingService(
    private val chatClientBuilder: ChatClient.Builder,
    private val answerRecordRepo: AnswerRecordRepository
) {
    // 扯次处理的题目数量
    private val BATCH_SIZE = 5

    companion object {
        private val log = LoggerFactory.getLogger(ExamBulkGradingService::class.java)
    }

    /**
     * 批量批改主方法
     */
    suspend fun batchGrading(requests: List<QuestionTextGradingRequest>) {
        // 过滤掉无效题目（无答案的题目跳过）
        val validRequests = requests.filter { it.userAnswer.isNotBlank() }
        log.info("开始批量批阅，有效题目数量：{}", validRequests.size);

        // 分批处理
        val totalBatches = validRequests.size / BATCH_SIZE + (if (validRequests.size % BATCH_SIZE > 0) 1 else 0)

        (0 until totalBatches).forEach { batchIndex ->
            val start = batchIndex * BATCH_SIZE
            val end = minOf(start + BATCH_SIZE, validRequests.size)
            val batch = validRequests.subList(start, end)

            log.info("处理第 ${batchIndex + 1}/$totalBatches 批次，本批 ${batch.size} 条")
            processBatch(batch)
        }
    }

    /**
     * 单批次内：为每个题目创建一个协程任务，并行执行批改任务
     */
    private suspend fun processBatch(batch: List<QuestionTextGradingRequest>) {
        // 使用 Dispatchers.IO 用户 I/O 密集型的 AI 调用
        val deferredResults = batch.map { question ->
            CoroutineScope(Dispatchers.IO).async {
                try {
                    gradeOneQuestion(question)
                } catch (e: Exception) {
                    log.error("处理答题记录 ${question.recordId} 时出错", e)
                    throw BusinessException("AI 批改失败")
                }
            }

        }
        // 等待本批次所有任务完成
        val results = deferredResults.awaitAll()

        // 批量存入数据库
        if (results.isNotEmpty()) {
            answerRecordRepo.saveEntities(results, SaveMode.UPDATE_ONLY)
        }
    }

    private fun gradeOneQuestion(question: QuestionTextGradingRequest): AnswerRecord {
        // 1. 构建 ChatClient(可全局注入一个带默认配置的)
        val chatClient = chatClientBuilder
            .build()
        // 3. 调用大模型 + 结构化输出（最关键一步）
        val chatResponse = chatClient.prompt()
            .user { userSpec: ChatClient.PromptUserSpec ->
                userSpec
                    .text(PromptConstant.QUESTION_GRADE_USER_PROMPT.trimIndent())
                    .param("title", question.title)
                    .param("answer", question.answer)
                    .param("score", question.score)
                    .param("userAnswer", question.userAnswer)
            }
            .call()
            .entity(GradingResult::class.java)
        return AnswerRecord {
            this.id = question.recordId
            this.aiCorrection = chatResponse?.correction
            this.score = chatResponse?.score
        }
    }
}