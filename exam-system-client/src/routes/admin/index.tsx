import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { dashboardStatsOptions } from '#/features/admin/dashboard/dashboardQueries.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { ClipboardList, FileQuestion, ScrollText, Users } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: DashboardPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(dashboardStatsOptions)
  },
})

function DashboardPage() {
  const { data } = useSuspenseQuery(dashboardStatsOptions)
  const stats = data.data

  const cards = [
    {
      title: '总用户数',
      value: stats.userCount.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: '总题目数',
      value: stats.questionCount.toLocaleString(),
      icon: FileQuestion,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      title: '总试卷数',
      value: stats.paperCount.toLocaleString(),
      icon: ScrollText,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      title: '考试记录',
      value: stats.examRecordCount.toLocaleString(),
      icon: ClipboardList,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Exam Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近考试记录</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentExamRecords.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              暂无考试记录
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>试卷名称</TableHead>
                  <TableHead>得分</TableHead>
                  <TableHead>考试时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentExamRecords.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {record.studentName}
                    </TableCell>
                    <TableCell>{record.paperName}</TableCell>
                    <TableCell>
                      {record.score != null ? `${record.score} 分` : '未批阅'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.createTime
                        ? new Date(record.createTime).toLocaleString('zh-CN')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
