import type { UserPageView } from '#/__generated/model/static'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover.tsx'
import { HelpCircle, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface UserTableProps {
  data: readonly UserPageView[]
  total: number
  page: number
  size: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onEdit: (user: UserPageView) => void
  onDelete: (id: number) => void
}

const ROLE_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' }
> = {
  admin: { label: '管理员', variant: 'default' },
  user: { label: '用户', variant: 'secondary' },
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: '正常', className: 'text-green-600 bg-green-50' },
  disabled: { label: '禁用', className: 'text-red-600 bg-red-50' },
}

export default function UserTable({
  data,
  total,
  page,
  size,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: UserTableProps) {
  // 分页由后端返回的数据量决定，total 是上次请求返回的数据条数
  const totalPages = Math.ceil(total / size)

  // 格式化时间
  const formatTime = (t: string) => {
    if (!t) return '-'
    return t.replace('T', ' ').substring(0, 19)
  }

  return (
    <div className="space-y-4">
      {/* 表格 */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead className="w-20">角色</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-44">创建时间</TableHead>
              <TableHead className="w-48">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((user) => {
                const roleInfo = ROLE_MAP[user.role] ?? {
                  label: user.role,
                  variant: 'secondary' as const,
                }
                const statusInfo = STATUS_MAP[user.status] ?? {
                  label: user.status,
                  className: '',
                }

                return (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{user.id}</TableCell>

                    <TableCell>{user.email}</TableCell>

                    <TableCell>{user.realName}</TableCell>

                    <TableCell>
                      <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      {formatTime(user.createTime)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(user)}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          编辑
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              删除
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start gap-2">
                                <HelpCircle className="text-destructive mt-0.5 h-5 w-5" />
                                <div className="space-y-1">
                                  <h4 className="leading-none font-medium">
                                    确定要删除吗？
                                  </h4>
                                  <p className="text-muted-foreground text-sm">
                                    删除后无法恢复，请谨慎操作。
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost">
                                  取消
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    onDelete(user.id)
                                    toast.success('用户删除成功')
                                  }}
                                >
                                  确定
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            第 {page} / {totalPages} 页，每页{' '}
            <Select
              value={size.toString()}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((s) => (
                  <SelectItem key={s} value={s.toString()}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>{' '}
            条
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              上一页
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
