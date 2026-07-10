import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import type { UserPageView } from '#/__generated/model/static'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '#/components/ui/drawer.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { useIsMobile } from '#/hooks/use-mobile.ts'
import z from 'zod'

interface UserDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  user: UserPageView | null
  onSubmit: (values: {
    email: string
    realName: string
    password: string
    role: string
    status: string
  }) => void
}

const addSchema = z.object({
  email: z.string().min(1, '请输入邮箱').email('邮箱格式不正确'),
  realName: z.string().min(1, '请输入姓名'),
  password: z.string().min(6, '密码长度不能小于6位字符'),
  role: z.string().min(1, '请选择角色'),
  status: z.string().min(1, '请选择状态'),
})

const editSchema = z.object({
  email: z.string().min(1, '请输入邮箱').email('邮箱格式不正确'),
  realName: z.string().min(1, '请输入姓名'),
  password: z
    .string()
    .refine((val) => !val || val.length >= 6, '密码长度不能小于6位字符'),
  role: z.string().min(1, '请选择角色'),
  status: z.string().min(1, '请选择状态'),
})

export default function UserDrawer({
  open,
  onOpenChange,
  mode,
  user,
  onSubmit,
}: UserDrawerProps) {
  const isMobile = useIsMobile()
  const schema = mode === 'add' ? addSchema : editSchema

  const form = useForm({
    defaultValues: {
      email: '',
      realName: '',
      password: '',
      role: 'user',
      status: 'active',
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
      form.reset()
    },
  })

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && user) {
        form.reset({
          email: user.email,
          realName: user.realName,
          password: '',
          role: user.role || 'user',
          status: user.status || 'active',
        })
      } else {
        form.reset({
          email: '',
          realName: '',
          password: '',
          role: 'user',
          status: 'active',
        })
      }
    }
  }, [open, mode, user, form])

  return (
    <Drawer
      direction={isMobile ? 'bottom' : 'right'}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{mode === 'add' ? '新增用户' : '编辑用户'}</DrawerTitle>
          <DrawerDescription>
            {mode === 'add'
              ? '创建新的系统用户'
              : `编辑用户「${user?.realName || ''}」的信息`}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4" data-vaul-no-drag>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* 邮箱 */}
            <form.Field
              name="email"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="请输入邮箱地址"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            />

            {/* 姓名 */}
            <form.Field
              name="realName"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="realName">姓名</Label>
                  <Input
                    id="realName"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="请输入姓名"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            />

            {/* 密码 */}
            <form.Field
              name="password"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    密码
                    {mode === 'edit' && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        （留空则不修改）
                      </span>
                    )}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={
                      mode === 'add' ? '请输入密码' : '留空则不修改密码'
                    }
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            />

            {/* 角色 */}
            <form.Field
              name="role"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="role">角色</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">用户</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            />

            {/* 状态 */}
            <form.Field
              name="status"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="disabled">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            />

            <DrawerFooter className="px-0 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={() => form.handleSubmit()}>
                {mode === 'add' ? '新增' : '保存'}
              </Button>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
