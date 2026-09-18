# 已知坑点 (exam-system-java)

## Jimmer Java API
- `notIn()` / `in()` 在 Java API 中是小写，不是 `valueNotIn`/`valueIn`（后者是 Kotlin DSL 扩展）
- **`@IdView` 的真实作用范围**：只影响 **Fetcher 和 DTO**，不影响查询。
  `Paper.java` 没有声明 `@IdView userId()`，但 `PaperTable` 依然生成了 `userId()`，
  `PaperDraft.setUserId(long)` 也在。所以**写 owner 过滤查询（`t.userId().eq(me)`）不需要 `@IdView`**；
  只有 `Fetcher.userId()` 或 DTO 要引用 `userId` 时才必须加。
  （这条容易被读成"不加就没有 `xxxId()`"，实际上只有 Fetcher/DTO 那一半才受影响。）

## 数据库相关坑点 → 见 `docs/database.md`

- mysqlsh 多条语句中途报错会**静默中止且退出码为 0**
- `information_schema.tables.auto_increment` 对 InnoDB **不可靠**，判计数器要用 `SHOW CREATE TABLE`
- 给已有数据的列加 `AUTO_INCREMENT` 后，**计数器不会自动设为 `max(id)+1`**，必须显式校正
- 事务探针验证法（改 DDL 前后都该用）

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