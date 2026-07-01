'use no memo'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '#/components/ui/drawer.tsx'
import { Input } from '#/components/ui/input.tsx'
import { useIsMobile } from '#/hooks/use-mobile.ts'
import { Button } from '#/components/ui/button.tsx'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select.tsx'
import { Label } from '#/components/ui/label.tsx'
import type { BannersDto } from '#/__generated/model/dto'
import { useForm } from '@tanstack/react-form'
import type { BannerSaveInput } from '#/__generated/model/static'
import BannerImageUpload from '#/components/BannerImageUpload.tsx'
import { useEffect } from 'react'

interface TableCellViewerProps {
  open: boolean
  item: BannersDto['BannerController/BANNER_ITEM_ADMIN'] | null
  setOpen: (value: ((prevState: boolean) => boolean) | boolean) => void
  onSubmit: (banner: BannerSaveInput) => void
}

const defaultBanner: BannerSaveInput = {
  active: true,
  description: '',
  linkUrl: '',
  sortOrder: 0,
  imageUrl: '',
  title: '',
}

export default function TableCellViewer({
  open,
  item,
  setOpen,
  onSubmit,
}: TableCellViewerProps) {
  const isMobile = useIsMobile()

  const form = useForm({
    defaultValues: item ?? defaultBanner,
    onSubmit: async ({ value }) => {
      // Do something with form data
      console.log(value)
      onSubmit(value)
      form.reset(item ?? defaultBanner)
      setOpen(false)
    },
  })

  useEffect(() => {
    form.reset(item ?? defaultBanner)
  }, [item, form])
  return (
    <Drawer
      direction={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={() => setOpen(false)}
    >
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item ? '编辑banner' : '新增banner'}</DrawerTitle>
          <DrawerDescription>
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div
          data-vaul-no-drag
          className="flex flex-col gap-4 overflow-y-auto px-4 text-sm"
        >
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-3">
              <form.Field
                name="title"
                children={(field) => (
                  <>
                    <Label htmlFor="header">标题</Label>
                    <Input
                      onDrag={(e) => e.preventDefault()}
                      id="header"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </>
                )}
              />
            </div>
            <div className="flex flex-col gap-3">
              <form.Field
                name="description"
                children={(field) => (
                  <>
                    <Label htmlFor="description">描述</Label>

                    <Input
                      id="description"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </>
                )}
              />
            </div>

            <div className="flex flex-col gap-3">
              <form.Field
                name="linkUrl"
                children={(field) => (
                  <>
                    <Label htmlFor="linkUrl">跳转链接</Label>

                    <Input
                      id="linkUrl"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </>
                )}
              />
            </div>
            <div className="flex flex-col gap-3">
              <form.Field
                name="sortOrder"
                children={(field) => (
                  <>
                    <Label htmlFor="sortOrder">排序顺序</Label>
                    <Input
                      id="sortOrder"
                      type={'number'}
                      min={0}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                    />
                  </>
                )}
              />
            </div>

            <div className="flex flex-col gap-3">
              <form.Field
                name="active"
                children={(field) => (
                  <>
                    <Label htmlFor="active">状态</Label>
                    <Select
                      value={field.state.value === true ? 'true' : 'false'}
                      onValueChange={(e) =>
                        field.handleChange(e.valueOf() === 'true')
                      }
                    >
                      <SelectTrigger id="active" className="w-full">
                        <SelectValue placeholder="状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="true">启用</SelectItem>
                          <SelectItem value="false">禁用</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </>
                )}
              />
            </div>
            <div className="flex flex-col gap-3">
              <form.Field
                name="imageUrl"
                children={(field) => (
                  <>
                    <Label htmlFor="imageUrl">轮播图</Label>
                    <BannerImageUpload
                      value={field.state.value}
                      onChange={field.handleChange}
                    />
                  </>
                )}
              />
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button onClick={() => form.handleSubmit()}>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
