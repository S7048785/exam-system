package com.yyjy.service

import com.yyjy.common.BusinessException
import com.yyjy.models.dto.QuestionGenerateDto
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
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
            .defaultSystem("你是一个专业的题目出题专家，严格按用户要求生成高质量题目。")
            .build()

        // 2. 构建 Prompt（使用模板更清晰）
        val userPrompt = """
            请根据以下要求生成关于 {category} 的 {count} 道题目：
            要求：
            1. 难度：{difficulty}
            2. 类型：{type}
            3. 特殊要求：{extraReq}
            4. **输出格式：必须返回标准的 JSON 数组，不要有任何额外文字或解释**
            5. 每道题都不能重复，不能有重复的题目或选项
            
            JSON 数组中的每个对象必须包含完整字段，如特殊要求中定义的格式。
            """.trimIndent()

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
            .chatResponse() // 返回 ChatResponse 对象
        val endTime = System.currentTimeMillis()


        // 4. 提取输出文本（用于日志记录）
        val outputText = chatResponse?.result?.output?.text
        log.info("AI 原始响应: $outputText") // 查看模型实际返回的 JSON 字符串
        // 5. 提取 Token 用量信息
        val usage = chatResponse?.metadata?.usage

        log.info("Token 输入消耗: ${usage?.promptTokens} - 输出消耗: ${usage?.completionTokens} - 总消耗: ${usage?.totalTokens}")
        log.info("调用模型: ${chatResponse?.metadata?.model}")
        log.info("调用大模型耗时: ${endTime - startTime}ms")
        // 6. 将响应内容转换为目标实体类
        return chatResponse?.let {
            // 从响应中提取文本并手动反序列化，或者使用框架提供的转换方法
            val converter = BeanOutputConverter(object : ParameterizedTypeReference<List<QuestionGenerateDto>>() {})
            outputText?.let { converter.convert(it) }
        }
    }

        private fun generateExtraRequirements(type: String): String {
            if (type == "CHOICE") {
                return """
                **选择题特别要求**:
                1. 每个选项的权重相同，不能有空选项。
                2. 选择题包含单选和多选。
                3. 每个选项的陈述必须是唯一的，不能重复。
                4. 多选题的选项数量不能超过3个。
                5. 每道题都要有详细的答案解析
                6. 题目要有实际价值，贴近实际应用场景
                
                请严格以 JSON 数组格式输出，不要有任何额外文字和解释。
                每个题目必须包含以下字段：
                {
                    "title": "以下关于 Java 中 final 关键字的描述，正确的有",
                    "type": "CHOICE",
                    "multi": true,
                    "difficulty": "EASY",
                    "score": "5",
                    "analysis": "final class 不能被继承、final 成员变量只能赋值一次，必须在声明或构造器中初始化。",
                    "choices": [
                        "用 final 修饰的类不能被继承",
                        "用 final 修饰的成员变量必须在声明时或构造方法中完成初始化",
                        "用 final 修饰的方法可以被重写",
                        "用 final 修饰的局部变量一旦赋值后可以再修改"
                    ],
                    "answer": "A,B"
                }
            """.trimIndent()
            }
            if (type == "JUDGE") {
                return """
                **判断题特别要求**:
                1. 确保生成的判断题中，正确答案(true)和错误答案(false)的数量大致平衡，不能全部是true或false。
                2. 错误的陈述应该是常见的误解或容易混淆的概念。
                3. 正确的陈述应该是重要的基础知识点。
                4. 每道题都要有详细的答案解析
                5. 题目要有实际价值，贴近实际应用场景
                
                请严格以 JSON 数组格式输出，不要有任何额外文字和解释。
                每个题目必须包含以下字段：
                {
                    "title": "Java 中，static 方法可以直接访问本类的非静态成员变量和非静态方法。",
                    "type": "JUDGE",
                    "multi": false,
                    "difficulty": "EASY",
                    "score": "5",
                    "analysis": "static 方法属于类级别，调用时可能还没有任何对象实例，而非静态成员必须依赖于具体对象，因此 static 方法不能直接访问非静态成员。",
                    "choices": null,
                    "answer": "false"
                }
            """.trimIndent()
            }
            if (type == "TEXT") {
                return """
                **简答题特别要求**:
                1. 简答题的答案必须是详细的，不能是简单的。
                2. 简答题的答案必须是实际的，贴近实际应用场景
                3. 答案要以markdown格式输出
                
                请严格以 JSON 数组格式输出，不要有任何额外文字和解释。
                每个题目必须包含以下字段：
                {
                    "title": "请简述 final、finally、finalize 的区别。",
                    "type": "TEXT",
                    "multi": false,
                    "difficulty": "EASY",
                    "score": "5",
                    "analysis": null,
                    "choices": null,
                    "answer": "
                        final：是一个关键字，用于修饰类、方法、变量。
                        修饰类：该类不能被继承。
                        修饰方法：该方法不能被重写。
                        修饰变量：变量一旦赋值后不能被修改（常量）。
    
                        finally：是异常处理中的一个代码块，与 try-catch 配合使用。
                        无论是否发生异常，finally 块中的代码都会执行（除非 JVM 退出），通常用于释放资源（如关闭文件、数据库连接等）。
                        
                        finalize：是 Object 类中的一个方法。
                        在垃圾回收器回收对象之前会被调用，用于对象清理工作。
                        但该方法不保证一定会执行，且从 JDK 9 开始已被标记为弃用，不推荐使用。
                    "
                }
            """.trimIndent()
            }
            throw BusinessException("题目类型错误")
        }
    }