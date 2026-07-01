package com.yyjy.common

import com.alibaba.excel.context.AnalysisContext
import com.alibaba.excel.event.AnalysisEventListener
import com.yyjy.constants.QuestionConstant
import com.yyjy.models.bo.QuestionExcelTemplateBo
import com.yyjy.models.entity.dto.QuestionImportView

/**
 * @author Nyxcirea
 * @date 2026/4/11
 * @description: TODO
 */
class QuestionExcelListener : AnalysisEventListener<QuestionExcelTemplateBo>() {
    //可以通过实例获取该值
    private val datas = mutableListOf<QuestionImportView>()
    private val errors = mutableListOf<String>()  // 收集所有错误
    /**
     * 监听到每一条数据都会执行此方法
     */
    override fun invoke(p0: QuestionExcelTemplateBo, analysisContext: AnalysisContext?) {

        // 校验数据，不抛异常，只收集错误
        val validationErrors = ValidateExcel.validateData(datas.size + 1, p0.content, p0.type, p0.answer, p0.multiple)

        if (validationErrors.isNotEmpty()) {
            // 有错误，记录但不处理这条数据
            errors.addAll(validationErrors)
            return  // 跳过这条数据
        }

        //数据存储到list，供批量处理，或后续自己业务逻辑处理。
        val question = QuestionImportView(
            title = p0.content!!,
            type = p0.type!!,
            multi = p0.multiple == "是",
            categoryId = p0.categoryId!!.toLong(),
            difficulty = p0.difficulty!!,
            score = p0.score?.toIntOrNull(),
            analysis = p0.analysis,
            answer = p0.answer,
        )
        val choices = mutableListOf<QuestionImportView.TargetOf_choices>()
        // 处理选择题的选项，判断题和简答题不需选项
        if (p0.type == QuestionConstant.TYPE.CHOICE) {
            val answer = p0.answer
            // 处理选项
            for ((index, item) in listOf(p0.choiceA, p0.choiceB, p0.choiceC, p0.choiceD).withIndex()) {
                choices.add(QuestionImportView.TargetOf_choices(
                    content = item!!,
                    sort = index,
                    correct = answer!!.contains(item)
                ))
            }
            question.choices = choices
        }
        datas.add(question)
    }

    fun getDatas(): List<QuestionImportView> {
        return datas
    }
    fun getErrors(): List<String> {
        return errors
    }
    /**
     * 解析完成之后执行此方法
     */
    override fun doAfterAllAnalysed(analysisContext: AnalysisContext?) {
        // 解析完成后，如果有错误，统一抛出
//        if (errors.isNotEmpty()) {
//            val errorMessage = errors.joinToString("\n")
//            throw BusinessException("数据校验失败：\n$errorMessage")
//        }
    }
}
object ValidateExcel {
    fun validateData(dataLen: Int, content: String?, type: String?, answer: String?, multiple: String?): List<String> {
        val errors = mutableListOf<String>()
        val prefix = "$dataLen 行数据"

        // 基础字段校验
        if (content.isNullOrBlank()) errors.add("$prefix: 缺失题目")
        if (type.isNullOrBlank()) errors.add("$prefix: 缺失题目类型")
        if (answer.isNullOrBlank()) errors.add("$prefix: 缺失答案")

        // multiple 字段校验
        if (multiple != "是" && multiple != "否") {
            errors.add("$prefix: 选择题答案必须为是或否")
        }

        // 根据题型校验答案
        when (type) {
            QuestionConstant.TYPE.JUDGE -> validateJudgeAnswer(answer, prefix, errors)
            QuestionConstant.TYPE.CHOICE -> validateChoiceAnswer(answer, multiple, prefix, errors)
        }

        return errors
    }

    private fun validateJudgeAnswer(answer: String?, prefix: String, errors: MutableList<String>) {
        if (answer != "true" && answer != "false") {
            errors.add("$prefix: 判断题答案必须为true或false")
        }
    }

    private fun validateChoiceAnswer(answer: String?, multiple: String?, prefix: String, errors: MutableList<String>) {
        if (answer.isNullOrBlank()) return

        when (multiple) {
            "是" -> validateMultipleChoice(answer, prefix, errors)
            "否" -> validateSingleChoice(answer, prefix, errors)
        }
    }

    private fun validateMultipleChoice(answer: String, prefix: String, errors: MutableList<String>) {
        val regex = Regex("^[A-D](,[A-D])+$")
        if (!regex.matches(answer)) {
            errors.add("$prefix: 选择题答案只能为A-D的字母，多个答案用逗号隔开")
        }
    }

    private fun validateSingleChoice(answer: String, prefix: String, errors: MutableList<String>) {
        if (answer.length != 1 || answer[0] !in 'A'..'D') {
            errors.add("$prefix: 选择题答案只能为A-D的字母")
        }
    }
}