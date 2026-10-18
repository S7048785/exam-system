# Jimmer DTO 规范 (exam-system-java)

Jimmer 有两种「DTO」，先选对再动手：

| 类型 | 位置 | 用途 | 谁来生成 |
|---|---|---|---|
| **`.dto` 投影** | `entity/src/main/dto/*.dto` | 从实体派生：裁字段、重命名、展平关联、带校验的入参 | Jimmer APT 生成到 `entity/target/generated-sources/annotations/.../dto/`（**禁手改**） |
| **手写 record** | `entity/src/main/java/.../io/req`、`io/res` | 契约需要计算字段 / 多表拼装 / 不暴露自增 id | 手写 |

需要「实体全字段 + 前端按 `@FetchBy` 取形状」→ 用 fetcher（见 `docs/java-jimmer-fetchers.md`）；
需要「只给前端几个字段 / 入参校验 / 关联展平」→ 用 `.dto`。

## `.dto` 文件写法

每个文件开头两行固定：

```
export com.yyjy.exam.entity.paper.entity.Paper
    -> package com.yyjy.exam.entity.paper.dto
```

三种声明：

- `XxxView { ... }` —— 查询视图，可嵌套（嵌套类型自动生成 `XxxView_TargetOf_xxx`）
- `input XxxInput { ... }` —— 入参，可挂 `jakarta.validation` 注解（需 `import`）
- 字段裸写 = 属性同名同类型；`as` 改名；`flat(assoc) { ... }` 展平 to-one；`children*` 取集合

```dto
PaperDetail {
    id
    name
    categoryId                 // 实体上的 @IdView，直接选，生成同层字段
    examSettings {             // to-one 嵌套 → 前端多一层
        duration
        @Min(value = 1, message = ValidationMessage.PAPER_MAX_ATTEMPTS_INVALID)
        maxAttempts
    }
    paperQuestions as questions {
        flat(question) {       // 把「卷上的题」展平到同一层
            id
            title
            questionChoices as choices { content }
        }
        score                  // 关联上的列写在**外层**，不要塞进 flat()
    }
}

input PaperSaveInput {
    id
    name
    participateMode
}
```

## 怎么用

```java
// 1. 单条查询
ExamTakingView view = sqlClient.findById(ExamTakingView.class, record.id());

// 2. 查询里当 fetch 目标
var page = sqlClient.createQuery(t)
        .where(...)
        .select(t.fetch(QuestionsPageView.class))
        .fetchPage(page - 1, size);

// 3. 直接做分页返回体
public PageRes<PaperReportView> listPaperReports(...)
```

## 手写 record 的规则

- 放 `io/res`（返回）/ `io/req`（入参），纯 `record`，不加 Lombok；
- **不返回自增 id**，对外统一 `publicId`（见 `ExamHistoryItemRes` / `ExamRecordListItemRes`）；
- 可能为空的数值用包装类型（`Integer`），别用 `int` 假装非空；
- 计算字段（用时、及格判定、封顶后的秒数）只能手写 record 或者查完在 service 里算 —— `.dto` 表达不了。

## 构建与前端联动

```bash
# 改 .dto 后
./mvnw.cmd install -pl entity -am -DskipTests
./mvnw.cmd compile -pl server
# 前端
bun run api
```

- 只改 fetcher **不用** clean（Maven 增量会整模块重编，实测有效）；
- 改 `.dto` 必须重编 `entity`，再重编 `server` —— ts.zip 的 `definitions` 来自 **server** 的编译期元数据，
  只编 entity 不动 server 的话，前端类型不会更新；
- `target/classes` 被进程占用时 clean 会失败，要 clean 先停后端。

TS 产物：`model/static/XxxView.ts`，嵌套部分是 `XxxView_TargetOf_paper.ts` 这类独立文件。

## 坑位

1. **嵌套 vs 平铺**：`categoryId`（`@IdView`）选出来是**同层字段**；`category { id }` 会多一层对象，TS 两层结构不同。
2. **`flat()` 只用于 to-one**（多对一/一对一）；一对多不能 flat，只能嵌套成数组。
3. **关联上的列写在外层**：`paperQuestions as questions { flat(question){...}  score }`，`score` 是卷面配分，写进
   `flat(question)` 会取到题目自带分值（两者可能不等）。
4. **`.dto` 不能写计算字段**：`usedSeconds`、`passed` 这类先在 service 算好，用手写 record 返回。
5. **改完前端类型没变** → 多半是 server 没重编（ts.zip 定义没刷新），不是浏览器缓存。
6. **入参校验**：`.dto` 里的 `@Min` / `@Email` 只有在 Controller 上标了 `@Valid` 才生效。
7. **删字段有残留**：删掉的 DTO 字段在旧 TS 里仍然存在，必须 `bun run api`。

## 参考实现

- `ExamRecords.dto` —— 视图 + `flat()` + 嵌套集合（`ExamTakingView` / `ExamRecordDetail`）
- `Paper.dto` —— 详情视图 + `input` + 报表视图（`flat(examSettings)`）
- `Users.dto` —— `input` + 校验注解
