# Jimmer ORM 规范 (exam-system-java)

## 实体规则
- 实体是 `interface`，不是 class
- 注解：`@Entity`、`@Id`、`@GeneratedValue(strategy = GenerationType.IDENTITY)`、`@Key`、`@ManyToOne`、`@OneToMany(mappedBy = "...")`、`@OneToOne(mappedBy = "...")`、`@IdView`、`@LogicalDeleted("now")`
- **所有实体**都有 `delFlag`（软删除，映射到 `deleted_at` 列）和 `createTime`/`updateTime`
- `@Formula(sql = "...")` 在 `org.babyfish.jimmer.Formula`，不是 `jimmer.sql`
- `@EnumType(EnumType.Strategy.NAME)` 在 enum **声明上**，不是属性上

## 软删除 + 时间戳
```java
@Column(name = "deleted_at")
@LogicalDeleted("now")
@Nullable LocalDateTime delFlag();

@Nullable LocalDateTime createTime();
@Nullable LocalDateTime updateTime();
```

## DTO 定义（.dto 文件）
- 位置：`entity/src/main/dto/`
- 5 个文件：`Users.dto`、`Questions.dto`、`Paper.dto`、`ExamRecords.dto`、`Categories.dto`
- `View` 类型用于查询返回，`Input` 类型用于新增/更新
- 生成类在 `entity/target/generated-sources/annotations/`，**不要手动编辑**
- 使用 `flat(association) { field1 field2 }` 展平关联字段
- 手写 DTO（非 Jimmer 生成）放在 `io/res/` 和 `io/req/` 包下

## Jimmer Java API 要点
```java
// 查询
QuestionsTable t = QuestionsTable.$;
sqlClient.createQuery(t)
    .where(t.categoryId().eq(categoryId))
    .where(t.title().like("%keyword%"))
    .orderBy(t.id().desc())
    .select(t.fetch(QuestionsPageView.class))
    .limit(size)
    .execute();

// 分页查询
query.select(t.fetch(SomeView.class)).fetchPage(page - 1, size);
// .getRows(), .getTotalRowCount(), .getTotalPageCount()

// 保存 Input（含关联子对象）
questionsRepository.save(input, SaveMode.INSERT_ONLY, AssociatedSaveMode.APPEND);

// 更新 Input
questionsRepository.save(input, SaveMode.UPDATE_ONLY);

// 删除
questionsRepository.deleteById(id);

// 单个查询
questionsRepository.findById(id)                                    // Optional<Questions>
sqlClient.getEntities().findById(QuestionsPageView.class, id)       // 直接 fetch DTO

// Repository 自定义方法（default method 或派生方法）
interface QuestionsRepository extends JRepository<Questions, Long> {
    boolean existsByTypeAndTitle(String type, String title);
    default List<SomeView> getLast(int size) {
        QuestionsTable t = QuestionsTable.$;
        return sql().createQuery(t)
            .orderBy(t.id().desc())
            .select(t.fetch(SomeView.class))
            .limit(size)
            .execute();
    }
}
```

`JRepository.sql()` 返回 `JSqlClient`（Kotlin `KRepository` 直接用 `sql` 属性）。
