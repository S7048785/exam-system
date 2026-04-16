package com.yyjy.controller

import com.yyjy.common.R
import com.yyjy.models.entity.*
import com.yyjy.models.entity.dto.PaperDetail
import com.yyjy.models.entity.dto.PaperSaveInput
import com.yyjy.service.PaperService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.babyfish.jimmer.client.FetchBy
import org.babyfish.jimmer.sql.kt.ast.expression.case
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.babyfish.jimmer.sql.kt.fetcher.newFetcher
import org.springframework.web.bind.annotation.*

@Tag(name = "试卷模块")
@RequestMapping("/paper")
@RestController
class PaperController(
    private val paperService: PaperService,
) {

    @Operation(summary = "新增试卷")
    @PostMapping("/add")
    fun addPaper(@RequestBody paper: PaperSaveInput): R<String?> {
        paperService.addPaper(paper)
        return R.ok()
    }

    @Operation(summary = "更新试卷")
    @PutMapping("/update")
    fun updatePaper(@RequestBody paper: Paper): R<String?> {
        return R.ok()
    }

    @Operation(summary = "删除试卷")
    @DeleteMapping("/remove/{id}")
    fun removePaper(@PathVariable id: Long): R<String?> {
        return R.ok()
    }

    @Operation(summary = "获取试卷")
    @GetMapping("/{id}")
    fun getPaper(@PathVariable id: Int): R<PaperDetail> {
        return R.ok(paperService.getPaper(id))
    }

    @Operation(summary = "试卷列表")
    @GetMapping("/list")
    fun listPapers(name: String?, status: String?): R<List<@FetchBy("PAPER_ITEM") Paper>> {
        return R.ok(paperService.listPapersByNameAndStatus(name, status, PAPER_ITEM))
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
