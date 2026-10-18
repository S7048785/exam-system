# Jimmer Fetcher 规范 (exam-system-java)

改动 Controller 的 `Fetcher`、用 `@FetchBy`、或要让「主对象 + 关联」一条 SQL 取回时看这份。

## 三条硬规则

1. **fetcher 声明在 Controller，且放在类的最下面**（所有接口方法之后）。
   `public static final`，命名 `XXX_ITEM` / `XXX_INFO`，供 `@FetchBy("...")` 按名字引用。
2. **to-one 关联要一条 SQL，必须显式写 `ReferenceFetchType.JOIN_ALWAYS`**。
   Jimmer 默认 `SELECT`（主查询 + 一条 `where FK in (...)` 的 LOAD），只写 `.assoc(fetcher)` 永远两条。
   集合关联（一对多/多对多）**不要**用 JOIN_ALWAYS（会把根对象行数放大，分页/聚合全错）。
3. **Service 只收 `Fetcher<T>` 参数，不自己造图**：
   `doSomething(long id, Fetcher<Paper> fetcher)`，内部 `sqlClient.findById(fetcher, id)` 或 `repo.findByXxx(key, fetcher)`。

## 标准写法

```java
public class ExamController {
    private final ExamTakingService examTakingService;
    // ... 接口方法 ...

    /** 入口页：试卷 + 1:1 的考试设置（JOIN_ALWAYS 才是一条 left join） */
    public static final Fetcher<Paper> EXAM_ENTRY_INFO =
            PaperFetcher.$
                    .name().description().published().totalScore().participateMode()
                    .examSettings(ReferenceFetchType.JOIN_ALWAYS,
                            PaperExamSettingsFetcher.$
                                    .start().end().duration().maxAttempts().showAnswerAfterSubmit());

    /** 返回实体时用 @FetchBy 指向上面的常量 */
    @GetMapping("/paper/{id}")
    public R<@FetchBy("EXAM_ENTRY_INFO") Paper> getExamPaperInfo(@PathVariable int id) {
        return R.ok(examTakingService.getPaperInfoForExaminee(id, EXAM_ENTRY_INFO));
    }
}
```

- `PaperFetcher.$`（实体自有 Fetcher 类）与 `Fetchers.PAPER_FETCHER` 等价：同一文件内保持一致即可，
  跨实体嵌套时更常用 `Fetchers.XXX_FETCHER`。
- 返回 **手写 DTO** 而非实体时不需要 `@FetchBy`，fetcher 仍由 Controller 传给 Service
  （如 `HISTORY_ITEM` / `RESULT_ITEM` 走 `ExamTakingService#getExamHistory/getExamResult`）。

## 前端类型怎么来

`@FetchBy("X")` 的形状生成在**实体自己的 Dto 命名空间**下，不是 Controller 的：

```ts
import type { PaperDto } from '#/__generated/model/dto'
type EntryPaper = PaperDto['ExamController/EXAM_ENTRY_INFO']
```

- 键名格式 `'<ControllerSimpleName>/<FETCHER_NAME>'`；
- 没被 fetcher 取到的字段在类型里不存在；`@Nullable` 关联是 `xxx?: {...} | undefined`，前端要兜底；
- 改完 fetcher 必须 `bun run api` 重生成，否则前端拿旧形状。

## 构建方式（实测）

| 改了什么 | 命令 | 要不要 clean |
|---|---|---|
| **只改 fetcher**（增删字段 / 改 JOIN_ALWAYS） | `./mvnw.cmd compile -pl server` | **不用**。实测删掉 `.description()` 后增量编译 13s，接口与 ts.zip 同步变化；加回来 3.6s 又同步 |
| 改 `.dto` / 实体接口 | `./mvnw.cmd install -pl entity -am -DskipTests` 再 `compile -pl server` | 需要（DTO 定义要重新生成并打进 server 的元数据） |
| 纯 service / mapper 内部逻辑 | `./mvnw.cmd compile -pl server` | 不用 |

原因：Maven 的 `useIncrementalCompilation` 默认 `true` 意味着「有源文件变化就重编**整个模块**」
（日志 `Recompiling the module because of changed source code` + `Compiling 49 source files`），
Jimmer APT 每轮都能看到全部 controller，元数据不会因为「没 clean」而残缺。

⚠️ 唯一例外：**运行中的后端会锁 `target/classes`**，此时 `clean` 会删不掉目录而构建失败 —— 要 clean 就先停进程。

## 验证清单

1. 改 fetcher → `./mvnw.cmd compile -pl server` → 重启后端；
2. 启动带 `--jimmer.show-sql=true`，调一次接口，确认 `sql: select ...` **只有一条**且含 `left join`；
3. `curl -s localhost:8101/api/ts.zip | unzip -l - | grep services/` 确认 controller 数量没少；
4. 前端 `bun run api`，再 `./node_modules/.bin/eslint <改的文件>`。

## 坑位清单（实测）

### to-one 默认是「批量附加查询」，不是 join

官方文档（`query/object-fetcher/association`）：*By default, Jimmer uses batch-optimized additional
queries to fetch associated objects.* 未配置时 `ReferenceFetchType.AUTO` 等价于 `SELECT`。只写 `.assoc(fetcher)`：

```
sql: select ... from PAPER where ID = ?
sql: select ... from PAPER_EXAM_SETTINGS where PAPER_ID = ?     ← purpose: LOAD，多出来的一条
```

加 `JOIN_ALWAYS` 后：

```sql
select tb_1_.ID, ..., tb_2_.ID, tb_2_.START, ...
from PAPER tb_1_
left join PAPER_EXAM_SETTINGS tb_2_ on tb_1_.ID = tb_2_.PAPER_ID
where tb_1_.ID = ?
```

取值：`AUTO`（默认，解析为 SELECT）/ `SELECT` / `JOIN_IF_NO_CACHE` / `JOIN_ALWAYS`。
全局默认可用 `jimmer.default-reference-fetch-type`（不能配 `AUTO`）。

### `Top-level query does not support TableEx`

用 `PaperTableEx.$` 当查询根会抛 `IllegalArgumentException: Top-level query does not support TableEx`。
顶层根必须是普通 `Table`；`TableEx` 只能出现在 join 里 ⇒「一条 SQL 带关联」的唯一正路是 fetcher + JOIN_ALWAYS。

### `findById` 只有两个重载

```java
sqlClient.findById(Paper.class, id)     // 默认标量
sqlClient.findById(fetcher, id)         // 带取数图谱 ✅
// sqlClient.findById(Paper.class, id, fetcher)   ❌ 不存在
```

## 参考实现

- `ExamController.EXAM_ENTRY_INFO`：实体 + JOIN_ALWAYS + `@FetchBy`（入口页）
- `ExamController.HISTORY_ITEM` / `RESULT_ITEM`：fetcher 传进 service，返回手写 DTO（不外泄自增 id）
- `PaperController.PAPER_ITEM`：fetcher 传给列表查询，`PageRes<@FetchBy("PAPER_ITEM") Paper>`
  （未加 JOIN_ALWAYS，仍是两条 SQL；要改先确认前端不依赖字段出现顺序）
