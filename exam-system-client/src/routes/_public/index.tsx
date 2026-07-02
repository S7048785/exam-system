import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/')({
  component: App,
})

function App() {
  return (
    <main className="page-wrap px-4 pt-14 pb-8">
      <section className="rise-in rounded-lg border px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-muted-foreground mb-3 text-sm font-medium">
          考试系统
        </p>
        <h1 className="text-foreground mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight sm:text-6xl">
          在线考试平台
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl text-base sm:text-lg">
          快速创建和管理试卷，支持多种题型，智能组卷，在线考试。
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['题库管理', '支持选择题、判断题、简答题等多种题型，批量导入导出'],
          ['智能组卷', '按规则自动组卷，支持手动调整题目和分值'],
          ['在线考试', '限时考试，自动评分，实时查看考试记录'],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="rise-in rounded-lg border p-6"
            style={{ animationDelay: `${index * 90 + 80}ms` }}
          >
            <h2 className="text-foreground mb-2 text-base font-semibold">
              {title}
            </h2>
            <p className="text-muted-foreground m-0 text-sm">{desc}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
