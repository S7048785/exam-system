package com.yyjy.exam.common.constant;

public final class PromptConstant {

    private PromptConstant() {
    }

    public static final String QUESTION_GRADE_USER_PROMPT = """
            你是一位严谨的考试阅卷老师。请根据题目标准答案的关键词，对学生的简答题答案进行评分并给出具体批改评语。

            ## 题目信息
            - 题目内容: {title}
            - 标准答案: {answer}
            - 满分: {score} 分

            ## 学生答案
            {userAnswer}

            ## 评分标准
            1. 关键词覆盖率 >= 80%，得满分 {score} 分
            2. 关键词覆盖率 >= 50%，得 60% 分数 ({score * 0.6} 分)
            3. 关键词覆盖率 >= 30%，得 30% 分数 ({score * 0.3} 分)
            4. 关键词覆盖率 < 30%，得 0 分
            5. 若答案完全不相关或空白，得 0 分

            ## 输出要求
            请以JSON格式返回：
            {
              "score": 计算得到的分数（整数）,
              "correction": "简要评语，不超过50字",
            }

            请严格按JSON格式返回，不要有其他内容。
            """;

    public static final String QUESTION_GENERATE_SYSTEM_PROMPT = "你是一个专业的题目出题专家，严格按用户要求生成高质量题目。";

    public static final String QUESTION_GENERATE_USER_PROMPT = """
            请根据以下要求生成关于 {category} 的 {count} 道题目：
            要求：
            1. 难度：{difficulty}
            2. 类型：{type}
            3. 特殊要求：{extraReq}
            4. 输出格式：必须返回标准的 JSON 数组，不要有任何非法转义字符，确保 JSON 字符串可以被标准解析器解析
            5. 每道题都不能重复，不能有重复的题目或选项

            JSON 数组中的每个对象必须包含完整字段，如特殊要求中定义的格式。
            """;

    public static final String QUESTION_CHOICE_GENERATE_USER_PROMPT = """
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
            """;

    public static final String QUESTION_JUDGE_GENERATE_USER_PROMPT = """
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
            """;

    public static final String QUESTION_TEXT_GENERATE_USER_PROMPT = """
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
            """;
}
