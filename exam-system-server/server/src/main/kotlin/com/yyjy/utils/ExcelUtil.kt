package com.yyjy.utils

import com.alibaba.excel.EasyExcel
import com.yyjy.common.BusinessException
import com.yyjy.common.QuestionExcelListener
import com.yyjy.models.bo.QuestionExcelTemplateBo
import com.yyjy.models.entity.dto.QuestionImportView
import org.springframework.web.multipart.MultipartFile

/**
 * @author Nyxcirea
 * @date 2026/4/11
 * @description: TODO
 */
class ExcelUtil {
    companion object {

        fun parseExcelToQuestions(file: MultipartFile): List<QuestionImportView> {
            val inputStream = file.inputStream
            // 创建监听器对象
            val excelListener = QuestionExcelListener()
            EasyExcel.read(inputStream, QuestionExcelTemplateBo::class.java, excelListener)
                .sheet()
                .doRead()

            val errors = excelListener.getErrors()
            if (errors.isNotEmpty()) {
                throw BusinessException("数据校验失败：\n${errors.joinToString("\n")}")
            }
            // 获取解析后的数据
            return excelListener.getDatas()
        }
    }
}