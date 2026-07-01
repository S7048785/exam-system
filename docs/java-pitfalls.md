# 已知坑点 (exam-system-java)

## Jimmer Java API
- `notIn()` / `in()` 在 Java API 中是小写，不是 `valueNotIn`/`valueIn`（后者是 Kotlin DSL 扩展）

## PaperSaveInput.questions
类型是 `Map<? extends String, ? extends Integer>`，不是 `Map<Long, Double>`。
server 代码需 `Long.parseLong(key)` 转 key，`.doubleValue()` 转分值。

## Excel 导入流程
```
QuestionExcelListener → List<QuestionImportView>
→ QuestionService.parseExcel() → convertImportViewToInput()
→ QuestionImportService.importBatch()
```
中间有 `QuestionImportView` → `QuestionImportInput` 的转换步骤，不要遗漏。

## AI 生成
返回 `List<QuestionGenerateDto>`（手写 record，非 Jimmer 生成）。
DTO 定义在 `entity/src/main/java/.../io/res/QuestionGenerateDto.java`。

## 未实现功能
- `common/annotation/` 和 `common/aspect/` 目录为空
- `notice` 模块的 api/repository/service 均为空
- `ExamRecordController` 仅骨架方法
