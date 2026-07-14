import { createFileRoute } from '@tanstack/react-router'

import { useQuery } from '@tanstack/react-query'
import type {
  UserPageView,
  UserSaveInput,
  UserUpdateInput,
} from '#/__generated/model/static'
import UserTable from '#/features/admin/users/components/UserTable.tsx'
import UserDrawer from '#/features/admin/users/components/UserDrawer.tsx'
import { useState } from 'react'
import { usersQueryOptions } from '#/features/admin/users/userQueries.ts'
import {
  useAddUser,
  useDeleteUser,
  useUpdateUser,
} from '#/features/admin/users/useUserActions'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Loader2, Plus, Search, X } from 'lucide-react'

export const Route = createFileRoute('/admin/users')({
  component: UsersPage,
  ssr: false,
  pendingComponent: () => {
    return <div>加载中</div>
  },
})

function UsersPage() {
  const [pagination, setPagination] = useState({ page: 1, size: 10 })
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add')
  const [selectedUser, setSelectedUser] = useState<UserPageView | null>(null)

  const { data: listData, isFetching } = useQuery(
    usersQueryOptions({
      keyword: searchKeyword || undefined,
      ...pagination,
    }),
  )
  const users = listData?.data ?? []
  const total = users.length

  const addMutation = useAddUser(() => setDrawerOpen(false))
  const updateMutation = useUpdateUser(() => setDrawerOpen(false))
  const deleteMutation = useDeleteUser()

  const handleOpenAddDrawer = () => {
    setDrawerMode('add')
    setSelectedUser(null)
    setDrawerOpen(true)
  }

  const handleOpenEditDrawer = (user: UserPageView) => {
    setDrawerMode('edit')
    setSelectedUser(user)
    setDrawerOpen(true)
  }

  const handleSubmit = (values: {
    email: string
    realName: string
    password: string
    role: string
    status: string
  }) => {
    if (drawerMode === 'add') {
      addMutation.mutate(values as UserSaveInput)
    } else if (selectedUser) {
      const updateInput: UserUpdateInput = {
        id: selectedUser.id,
        email: values.email,
        realName: values.realName,
        password: values.password,
        role: values.role,
        status: values.status,
      }
      updateMutation.mutate(updateInput)
    }
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handlePageSizeChange = (newSize: number) => {
    setPagination({ page: 1, size: newSize })
  }

  const handleSearch = () => {
    setSearchKeyword(keyword)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClearSearch = () => {
    setKeyword('')
    setSearchKeyword('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="pr-8 pl-9"
            placeholder="搜索邮箱或姓名..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {keyword && (
            <button
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={handleSearch}>
          搜索
        </Button>
        <Button size="sm" onClick={handleOpenAddDrawer}>
          <Plus className="mr-1 h-4 w-4" />
          新增用户
        </Button>
      </div>

      {/* 列表 */}
      <div className="relative">
        {isFetching && (
          <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        )}
        <UserTable
          data={users}
          total={total}
          page={pagination.page}
          size={pagination.size}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleOpenEditDrawer}
          onDelete={handleDelete}
        />
      </div>

      {/* 新增/编辑 Drawer */}
      <UserDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        user={selectedUser}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
