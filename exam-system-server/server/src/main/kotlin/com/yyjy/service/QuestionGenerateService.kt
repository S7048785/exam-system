package com.yyjy.service

import com.yyjy.common.BusinessException
import com.yyjy.constants.PromptConstant
import com.yyjy.models.dto.QuestionGenerateDto
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.model.ChatResponse
import org.springframework.ai.converter.BeanOutputConverter
import org.springframework.core.ParameterizedTypeReference
import org.springframework.stereotype.Service
/**
 * @author Nyxcirea
 * @date 2026/4/12
 * @description: TODO
 */
@Service
class QuestionGenerateService(
    private val chatClientBuilder: ChatClient.Builder
) {
    companion object {
        private val log = LoggerFactory.getLogger(QuestionGenerateService::class.java)
    }

    fun generateQuestions(
        category: String,
        count: Int,
        difficulty: String,
        type: String, // 题型
        includeMultiple: Boolean, // 是否包含多选题
    ): List<QuestionGenerateDto>? {
        val typeDesc = when (type) {
            "CHOICE" -> if (includeMultiple) {
                "选择题(包含单选和多选)"
            } else {
                "选择题(仅单选)"
            }

            "JUDGE" -> "判断题(**重要：判断题答案只能是true或false，确保正确答案和错误答案的数量大致平衡，不能全部是true或false**)"
            "TEXT" -> "简答题"
            else -> "选择题"
        }

        val extraReq = generateExtraRequirements(type)
        val difficultyDesc = when (difficulty) {
            "EASY" -> "简单"
            "MEDIUM" -> "中等"
            "HARD" -> "困难"
            else -> "中等"
        }
        // 1. 构建 ChatClient(可全局注入一个带默认配置的)
        val chatClient = chatClientBuilder
            .defaultSystem(PromptConstant.QUESTION_GENERATE_SYSTEM_PROMPT.trimIndent())
            .build()

        // 2. 构建 Prompt（使用模板更清晰）
        val userPrompt = PromptConstant.QUESTION_GENERATE_USER_PROMPT.trimIndent()

        val startTime = System.currentTimeMillis()
        // 3. 调用大模型 + 结构化输出（最关键一步）
        val chatResponse = chatClient.prompt()
            .user { userSpec: ChatClient.PromptUserSpec ->
                userSpec
                    .text(userPrompt)
                    .param("category", category)
                    .param("count", count)
                    .param("difficulty", difficultyDesc)
                    .param("type", typeDesc)
                    .param("extraReq", extraReq)
            }
            .call()
            .chatResponse() ?: throw BusinessException("AI 响应为空") // 返回 ChatResponse 对象
        val endTime = System.currentTimeMillis()

        // 提取输出文本（用于日志记录）
        logAiMetrics(chatResponse, endTime - startTime)
        // 结构化解析
        return try {
            val converter = BeanOutputConverter(object : ParameterizedTypeReference<List<QuestionGenerateDto>>() {})
            chatResponse.result.output.text?.let { converter.convert(it) }
        } catch (e: Exception) {
            log.error("JSON 解析失败，原始文本: ${chatResponse.result.output.text}", e)
            throw BusinessException("生成题目解析失败")
        }
    }

    private fun generateExtraRequirements(type: String): String {
        if (type == "CHOICE") {
            return PromptConstant.QUESTION_CHOICE_GENERATE_USER_PROMPT.trimIndent()
        }
        if (type == "JUDGE") {
            return PromptConstant.QUESTION_JUDGE_GENERATE_USER_PROMPT.trimIndent()
        }
        if (type == "TEXT") {
            return PromptConstant.QUESTION_TEXT_GENERATE_USER_PROMPT.trimIndent()
        }
        throw BusinessException("题目类型错误")
    }

    private fun logAiMetrics(response: ChatResponse, duration: Long) {
        val usage = response.metadata.usage
        log.info("""
            --- AI 调用报告 ---
            响应内容摘要: ${response.result.output.text}
            模型: ${response.metadata.model}
            耗时: ${duration}ms
            Token: 输入 ${usage.promptTokens} / 输出 ${usage.completionTokens} / 总计 ${usage.totalTokens}
            ------------------
        """.trimIndent())
    }
}