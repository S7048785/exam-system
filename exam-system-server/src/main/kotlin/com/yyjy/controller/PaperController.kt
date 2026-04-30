package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.constants.PaperStatus
import com.yyjy.models.dto.PaperAiSaveDto
import com.yyjy.models.entity.*
import com.yyjy.models.entity.dto.PaperDetail
import com.yyjy.models.entity.dto.PaperSaveInput
import com.yyjy.models.entity.dto.PaperUpdateInput
import com.yyjy.service.PaperService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.babyfish.jimmer.client.FetchBy
import org.babyfish.jimmer.client.meta.Api
import org.babyfish.jimmer.sql.kt.ast.expression.case
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.babyfish.jimmer.sql.kt.fetcher.newFetcher
import org.springframework.web.bind.annotation.*


@Api
@Tag(name = "试卷模块")
@RequestMapping("/paper")
@RestController
class PaperController(
    private val paperService: PaperService,
) {

    @Api
    @Operation(summary = "新增试卷")
    @PostMapping("/add")
    fun addPaper(@RequestBody paper: PaperSaveInput): R<String?> {
        paperService.addPaper(paper)
        return R.ok()
    }

    @Api
    @Operation(summary = "更新试卷")
    @PutMapping("/update")
    fun updatePaper(@RequestBody paper: PaperUpdateInput): R<String?> {
        paperService.updatePaper(paper)
        return R.ok()
    }

    @Api
    @Operation(summary = "删除试卷")
    @DeleteMapping("/remove/{id}")
    fun removePaper(@PathVariable id: Int): R<String?> {
        paperService.removePaper(id)
        return R.ok()
    }

    @Api
    @Operation(summary = "获取试卷详情")
    @GetMapping("/{id}")
    fun getPaper(@PathVariable id: Int): R<PaperDetail> {
        return R.ok(paperService.getPaper(id))
    }

    @Api
    @Operation(summary = "试卷列表")
    @GetMapping("/list")
    fun listPapers(
        @RequestParam(name = "name", required = false) name: String?, // 明确可选
        @RequestParam(name = "status", required = false) status: PaperStatus?
    ): R<List<@FetchBy("PAPER_ITEM") Paper>> {
        return R.ok(paperService.listPapersByNameAndStatus(name, status, PAPER_ITEM))
    }

    @Api
    @Operation(summary = "AI智能组卷", description = "根据用户输入的规则，智能生成试卷，包括选择题、判断题、简答题等多种题型。")
    @PostMapping("/ai")
    fun aiPaper(@RequestBody paperAiSaveDto: PaperAiSaveDto): R<Paper> {
        return R.ok(paperService.aiCreatePaper(paperAiSaveDto))
    }

    @Api
    @PostMapping("/{id}/status") // 处理POST请求
    @Operation(summary = "更新试卷状态", description = "修改试卷状态：发布试卷供学生考试或停止试卷禁止考试") // API描述
    fun updatePaperStatus(
        @PathVariable id: Int,
        status: String
    ): R<String?> {
        paperService.updateStatus(id, status)
        return R.ok()
    }


    companion object {
        val PAPER_ITEM = newFetcher(Paper::class).by {
            name()
            description()
            status()
            totalScore()
            questionCount()
            duration()
            createTime()
        }
        val PAPER_DETAIL = newFetcher(Paper::class).by {
            PAPER_ITEM
            paperQuestions(
                childFetcher = newFetcher(PaperQuestion::class).by {
                    question(
                        newFetcher(Questions::class).by {
                            title()
                            type()
                            score()
                            questionChoices(
                                newFetcher(QuestionChoices::class).by {
                                    content()
                                    correct()
                                }
                            )
                        },

                    )
                },
                // 对题目进行排序
                cfgBlock = {
                    filter {
                        orderBy(
//                            table.question.id.desc()
                                    case()
                                        .match(table.question.type.eq("CHOICE"), 1)
                                        .match(table.question.type.eq("JUDGE"), 2)
                                        .match(table.question.type.eq("TEXT"), 3)
                                        .otherwise(99)
                        )
                    }
                }
            )
        }
    }
}
