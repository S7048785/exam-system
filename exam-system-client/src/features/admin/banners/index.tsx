import type { BannerSaveInput } from '#/__generated/model/static'
import { api } from '#/ApiInstance.ts'
import { bannerAllQueryOptions } from '#/features/admin/banners/bannerQueries.ts'
import BannerTable from '#/features/admin/banners/BannerTable.tsx'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

export default function BannersPage() {
  const queryClient = useQueryClient()

  // 使用 useSuspenseQuery + 共享的 queryOptions
  // 数据已经由 loader 预取，isPending 几乎不会触发（除非首次无缓存）
  const { data, refetch } = useSuspenseQuery(bannerAllQueryOptions)

  const addMutation = useMutation({
    mutationFn: (banner: BannerSaveInput) =>
      api.bannerController.addBanner({ body: banner }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerAll'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.bannerController.deleteBanner({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerAll'] })
    },
  })
  const updateMutation = useMutation({
    mutationFn: (banner: BannerSaveInput) =>
      api.bannerController.updateBanner({ body: banner }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerAll'] })
    },
  })

  const handleAddBanner = (banner: BannerSaveInput) => {
    addMutation.mutate(banner)
  }

  const handleDeleteBanner = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleUpdateBanner = (banner: BannerSaveInput) => {
    updateMutation.mutate(banner)
  }

  return (
    <div className="">
      <BannerTable
        data={data.data!}
        refetch={() => {
          refetch()
        }}
        addBanner={handleAddBanner}
        deleteBanner={handleDeleteBanner}
        updateBanner={handleUpdateBanner}
      />
    </div>
  )
}
