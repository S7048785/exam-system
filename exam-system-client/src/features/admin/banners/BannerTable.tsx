import { useState } from 'react'

import { Badge } from '#/components/ui/badge.tsx'
import { Button } from '#/components/ui/button.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table.tsx'
import type { BannersDto } from '#/__generated/model/dto'
import TableCellViewer from '#/features/admin/banners/TableCellViewer.tsx'

import type { BannerSaveInput } from '#/__generated/model/static'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover.tsx'
import { HelpCircle, ImageIcon, Plus, RotateCw } from 'lucide-react'
import { toast } from 'sonner'

interface BannerTableProps {
  data: readonly BannersDto['BannerController/BANNER_ITEM_ADMIN'][]
  refetch: () => void
  addBanner: (banner: BannerSaveInput) => void
  deleteBanner: (id: number) => void
  updateBanner: (banner: BannerSaveInput) => void
}

export default function BannerTable({
  data,
  refetch,
  addBanner,
  deleteBanner,
  updateBanner,
}: BannerTableProps) {
  const [selectedBanner, setSelectedBanner] = useState<
    BannersDto['BannerController/BANNER_ITEM_ADMIN'] | null
  >(null)

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  const handleOpenDrawer = (
    banner?: BannersDto['BannerController/BANNER_ITEM_ADMIN'],
  ) => {
    // 这种写法更符合常见的业务场景
    setSelectedBanner(banner ?? null)
    setDrawerOpen(true)
  }

  const handleSubmit = (banner: BannerSaveInput) => {
    if (selectedBanner) {
      updateBanner(banner)
      toast('轮播图更新成功')
    } else {
      addBanner(banner)
      toast('轮播图新增成功')
    }
  }

  const onRefetchClick = () => {
    refetch()
    toast('已刷新')
  }
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 获取 data-id 的值
    const id = e.currentTarget.dataset.id
    console.log('选中的ID是:', id)
    deleteBanner(Number(id))
    toast('轮播图删除成功')
    refetch()
  }

  const renderBannerRow = (
    banner: BannersDto['BannerController/BANNER_ITEM_ADMIN'],
  ) => {
    return (
      <TableRow key={banner.id} className="hover:bg-muted/50">
        <TableCell className="h-16 px-4 font-medium">{banner.id}</TableCell>
        <TableCell className="h-16 px-4">
          {banner.imageUrl ? (
            <img
              src={banner.imageUrl}
              alt=""
              className="w-32 rounded-md object-cover"
            />
          ) : (
            <ImageIcon className="mx-auto size-8 opacity-60" />
          )}
        </TableCell>
        <TableCell className="text-muted-foreground h-16 px-4 text-sm">
          <Button variant="link" onClick={() => handleOpenDrawer(banner)}>
            {banner.title}
          </Button>
        </TableCell>
        <TableCell className="text-muted-foreground h-16 px-4 text-sm">
          <div className={'w-20 truncate'}>{banner.description}</div>
        </TableCell>
        <TableCell className="text-muted-foreground h-16 px-4 text-sm">
          {banner.linkUrl}
        </TableCell>
        <TableCell className="text-muted-foreground h-16 px-4 text-sm">
          {banner.sortOrder}
        </TableCell>
        <TableCell className="text-muted-foreground h-16 px-4 text-sm">
          {banner.active ? (
            <Badge
              variant="outline"
              className="border-0 bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20"
            >
              启用
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-0 bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
            >
              禁用
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground h-16 px-4 text-sm">
          {new Date(banner.createTime!).toLocaleString()}
        </TableCell>
        <TableCell className="text-muted-foreground h-16 px-4 text-sm">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="destructive">删除</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2">
                  <HelpCircle className="text-destructive mt-0.5 h-5 w-5" />
                  <div className="space-y-1">
                    <h4 className="leading-none font-medium">确定要删除吗？</h4>
                    <p className="text-muted-foreground text-sm">
                      此操作无法撤销，请谨慎操作。
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
                    data-id={banner.id}
                    onClick={handleDelete}
                  >
                    确定
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      <div className={'mb-2 flex justify-end'}>
        <Button variant="outline" size="sm" onClick={() => handleOpenDrawer()}>
          <Plus />
          <span className="hidden lg:inline">新增banner</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onRefetchClick}>
          <RotateCw />
          <span className="hidden lg:inline">刷新</span>
        </Button>
      </div>
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="h-12 px-4 font-medium">ID</TableHead>
              <TableHead className="h-12 px-4 font-medium">轮播图</TableHead>
              <TableHead className="h-12 px-4 font-medium">标题</TableHead>
              <TableHead className="h-12 px-4 font-medium">描述</TableHead>
              <TableHead className="h-12 px-4 font-medium">跳转链接</TableHead>
              <TableHead className="h-12 px-4 font-medium">排序</TableHead>
              <TableHead className="h-12 px-4 font-medium">状态</TableHead>
              <TableHead className="h-12 px-4 font-medium">创建时间</TableHead>
              <TableHead className="h-12 px-4 font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{data.map(renderBannerRow)}</TableBody>
        </Table>

        <TableCellViewer
          open={drawerOpen}
          setOpen={setDrawerOpen}
          item={selectedBanner}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  )
}
