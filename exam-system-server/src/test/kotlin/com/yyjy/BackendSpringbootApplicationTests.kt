package com.yyjy

import com.alibaba.excel.EasyExcel
import com.yyjy.common.BusinessException
import com.yyjy.common.QuestionExcelListener
import com.yyjy.models.bo.QuestionExcelTemplateBo
import com.yyjy.models.entity.*
import com.yyjy.models.entity.dto.CategoriesTree
import com.yyjy.models.entity.dto.QuestionSaveInput
import com.yyjy.repository.CategoriesRepository
import com.yyjy.service.QuestionService
import org.babyfish.jimmer.sql.exception.SaveException
import org.babyfish.jimmer.sql.kt.KSqlClient
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.annotation.Rollback
import java.io.File

@SpringBootTest
class BackendSpringbootApplicationTests {

	@Autowired
	private lateinit var sqlClient: KSqlClient
	@Autowired
	private lateinit var categoryRepository: CategoriesRepository
    @Autowired
    private lateinit var questionService: QuestionService

    @Test
    fun contextLoads() {
//val items = KSqlClient.entities.findAll(Banners::class)
//		val items = bannersRepository?.findAll(SortUtils.toSort("sortOrder desc"))
        val items = sqlClient.createQuery(Categories::class) {
            where(table.parentId eq 0)
            orderBy(table.sort)
            select(table.fetch(CategoriesTree::class))
        }.execute()
//		val childrenMap = items.stream().collect(Collectors.groupingBy {it.parentId})

        calculateCount(items)
        println(items)
    }

    @Test
    fun testDelete() {
        // 查询是否存在子分类
        val hasChildren = categoryRepository.existsByParentId(16)
        if (hasChildren) {
            println("该分类下有子分类，不能删除")
            return
        }
        // 该分类是否有题目
        val exists = categoryRepository.sql.createQuery(Categories::class) {
            where(table.id eq 16)
            select(table.asTableEx().questions.id)
        }.exists()
        if (exists) {
            println("该分类下有题目，不能删除")
            return
        }
        try {
            categoryRepository.deleteById(16)
        } catch (e: SaveException.CannotDissociateTarget) {
            println(e.message)
        }
        println("删除成功")
    }

    @Rollback(false)
    @Test
    fun testService() {
        val question = QuestionSaveInput(
            title = "测试2号判断题",
            type = "JUDGE",
            multi = false,
            categoryId = 0,
            difficulty = "EASY",
            score = 1,
            analysis = "这是一个判断题",
            answers = QuestionSaveInput.TargetOf_answers(answer = "true")
        )
        questionService.save(question)
    }

    @Rollback(false)
    @Test
    fun testQuestionDelete() {
        val id = 81L
        questionService.remove(id)
    }

    fun calculateCount(categories: List<CategoriesTree>): Int {
        var total = 0
        for (node in categories) {
            if (node.children!!.isEmpty()) {
                // 如果是叶子节点，保持它原有的 count (或者根据业务逻辑处理)
                total += node.questionCount
            } else {
                // 如果有子节点，递归计算子节点的总和
                val childrenSum = node.children?.let { calculateCount(it) }
                if (childrenSum != null) {
                    node.questionCount = childrenSum
                } // 将汇总值赋给父节点
                if (childrenSum != null) {
                    total += childrenSum
                }
            }
        }
        return total
    }

    @Test
    fun testPopularQuestions() {
        val questions = questionService.getPopularQuestions(10)
        println(questions)
//        val data = sqlClient.createQuery(Questions::class) {
//            orderBy(table.id.desc())
//            select(table.fetch(QuestionsPageView::class))
//        }.limit(10).execute()
//
//        print(data)
    }

    @Test
    fun testExcelImport() {
        val file = File("Excel题目模板 (1).xlsx")
        // 创建监听器对象
        val excelListener = QuestionExcelListener()
        EasyExcel.read(file.inputStream(), QuestionExcelTemplateBo::class.java, excelListener)
            .sheet()
            .doRead()

        val errors = excelListener.getErrors()
        if (errors.isNotEmpty()) {
            throw BusinessException("数据校验失败：\n${errors.joinToString("\n")}")
        }
        // 获取解析后的数据
        println(excelListener.getDatas())
    }
}
