package com.yyjy.controller

import com.yyjy.models.entity.dto.CategorySaveInput
import com.yyjy.models.entity.dto.CategoryUpdateInput
import com.yyjy.repository.CategoriesRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Transactional

@SpringBootTest
@AutoConfigureMockMvc // 自动配置 MockMvc,模拟 Web 交互
@Transactional
class CategoryControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc // Spring Test 的伪客户端

    @Autowired
    private lateinit var categoriesRepository: CategoriesRepository

    private var testCategoryId: Long = 0

    @BeforeEach
    fun setup() {
        // 由于使用了 @Transactional，测试后自动回滚，不需要手动清理
        // 如果需要手动清理，使用正确的 Jimmer API:
        // val ids = categoriesRepository.findAll().map { it.id }
        // sqlClient.deleteAll(Categories::class, ids)
    }

    @Test
    fun `add category success`() {
        val categorySaveInput = CategorySaveInput(
            name = "测试分类",
            parentId = 0,
            sort = 1
        )

        // 开始执行一个请求
        mockMvc.perform(
            // 构造一个 POST 请求，目标地址是 /category/add。
            post("/category/add")
                // 设置 HTTP Header，告诉服务器：“我给你发的是 JSON 格式的数据”。
                .contentType(MediaType.APPLICATION_JSON)
                // 设置请求体（Body）。这里把你的 Kotlin 对象转成了字符串。
                .content(toJson(categorySaveInput))
        )
            // 断言（Assert）。期望 HTTP 状态码是 200 (OK)。如果返回了 404 或 500，测试就会在这里挂掉。
            .andExpect(status().isOk)
            // 检查 JSON 内容。判断后端返回的业务逻辑状态码是不是真的成功
            .andExpect(jsonPath("$.code").value(200))
    }

    @Test
    fun `add category with duplicate name should fail`() {
        // 先添加一个分类
        val categorySaveInput = CategorySaveInput(
            name = "重复分类",
            parentId = 0,
            sort = 1
        )
        categoriesRepository.save(categorySaveInput)

        // 尝试添加同名分类
        mockMvc.perform(
            post("/category/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(categorySaveInput))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.msg").value("分类名已存在"))
    }

    @Test
    fun `update category success`() {
        // 先添加一个分类
        val saved = categoriesRepository.save(
            CategorySaveInput(
                name = "原分类名",
                parentId = 0,
                sort = 1
            )
        )
        testCategoryId = saved.id

        val updateInput = CategoryUpdateInput(
            id = testCategoryId,
            name = "更新后的分类名",
            parentId = 0,
            sort = 2
        )

        mockMvc.perform(
            put("/category/update/{id}", testCategoryId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(updateInput))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value(200))
    }

    @Test
    fun `update category with duplicate name should fail`() {
        // 添加两个分类
        val cat1 = categoriesRepository.save(
            CategorySaveInput(
                name = "分类A",
                parentId = 0,
                sort = 1
            )
        )
        val cat2 = categoriesRepository.save(
            CategorySaveInput(
                name = "分类B",
                parentId = 0,
                sort = 2
            )
        )

        // 尝试将 cat2 的名字改成 cat1 的名字
        val updateInput = CategoryUpdateInput(
            id = cat2.id,
            name = "分类A",
            parentId = 0,
            sort = 2
        )

        mockMvc.perform(
            put("/category/update/{id}", cat2.id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(updateInput))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.msg").value("分类名不能重复"))
    }

    @Test
    fun `remove category with children should fail`() {
        // 添加父分类
        val parent = categoriesRepository.save(
            CategorySaveInput(
                name = "父分类",
                parentId = 0,
                sort = 1
            )
        )

        // 添加子分类
        categoriesRepository.save(
            CategorySaveInput(
                name = "子分类",
                parentId = parent.id,
                sort = 1
            )
        )

        // 尝试删除父分类
        mockMvc.perform(delete("/category/remove/{id}", parent.id))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value(500))
            .andExpect(jsonPath("$.msg").value("该分类下有子分类，不能删除"))
    }

    @Test
    fun `list categories should return category list`() {
        // 添加测试数据
        categoriesRepository.save(CategorySaveInput(name = "分类1", parentId = 0, sort = 1))
        categoriesRepository.save(CategorySaveInput(name = "分类2", parentId = 0, sort = 2))

        mockMvc.perform(get("/category/list"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray)
    }

    @Test
    fun `get category tree should return tree structure`() {
        // 添加测试数据
        val parent = categoriesRepository.save(CategorySaveInput(name = "树形父分类", parentId = 0, sort = 1))
        categoriesRepository.save(CategorySaveInput(name = "树形子分类", parentId = parent.id, sort = 1))

        mockMvc.perform(get("/category/tree"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray)
    }

    private fun toJson(obj: Any): String {
        return when (obj) {
            is CategorySaveInput -> """{"name":"${obj.name}","parentId":${obj.parentId},"sort":${obj.sort}}"""
            is CategoryUpdateInput -> """{"id":${obj.id},"name":"${obj.name}","parentId":${obj.parentId},"sort":${obj.sort}}"""
            else -> "{}"
        }
    }
}
