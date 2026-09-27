import { useCallback } from 'react'
import { useImmer } from 'use-immer'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import z from 'zod'
import { api } from '#/ApiInstance.ts'
import type { PaperSaveInput } from '#/__generated/model/static'
import type { ParticipateMode } from '#/__generated/model/enums'

/**
 * 新增 / 编辑试卷向导的状态与动作。
 *
 * 状态**存在一个对象里**（而不是散成 5 个 `useState`，那样容易各自漂移），
 * 更新统一走 `patch` 合并。字段少、转移直白，不需要额外一层 action 抽象。
 *
 * 另外刻意回避了旧实现（已删除的 `EditDialog`）的三个毛病：
 *
 * 1. **不用 `useEffect` 回填**。初始值由调用方一次性传入（它必须等详情就绪再挂载本 hook）。
 *    旧实现有个 `useEffect(..., [dialogOpen, dialogMode, detailData])`，里面会
 *    `setCreatedPaperId(undefined)` + 重置步骤 + 清空表单 —— 详情查询的引用动一下，
 *    整个向导就被打回原点（刚创建的 id 也一起丢）。
 * 2. **保存是显式动作**。`patch({ step })` 只是切步骤，写库只发生在 `goDesign` / `publish` 里；
 *    失败就留在原地并把错误报出来，不会"点了没反应"。
 * 3. **单一事实来源**。`paperId` 只在 state 里，没有 `editPaperId ?? createdPaperId` 这种双来源；
 *    "已发布"也只有 `published` 一个标记。
 */

/** 试卷自身的 4 个字段（对应 `POST /paper/save`） */
export interface PaperDraft {
  name: string
  description: string
  categoryId: number | undefined
  participateMode: ParticipateMode
}

export const EMPTY_DRAFT: PaperDraft = {
  name: '',
  description: '',
  categoryId: undefined,
  participateMode: 'LOGIN_REQUIRED',
}

/** 回填来源（结构化匹配，不依赖生成 DTO 的精确类型名） */
interface DetailLike {
  name: string
  description?: string | null
  categoryId: number
  participateMode: ParticipateMode
}

export const toDraft = (d: DetailLike): PaperDraft => ({
  name: d.name,
  description: d.description ?? '',
  categoryId: d.categoryId,
  participateMode: d.participateMode,
})

/** 第 0 步「考试信息」的校验（只这 2 个字段必填） */
const infoSchema = z.object({
  name: z.string().trim().min(1, '请填写试卷名称'),
  categoryId: z.number('请选择试卷分类'),
})

/** 发布流程阶段：设置弹窗开着 / 正在发发布请求 / 空闲 */
export type PublishPhase = 'idle' | 'settings' | 'publishing'

export interface WizardState {
  step: number
  draft: PaperDraft
  /** 已落库的试卷 id：编辑模式开局就有，新建模式在第 0 步保存成功后写入 */
  paperId: number | undefined
  /** 本次会话内发布成功（详情缓存里的 `published` 可能还是旧值） */
  published: boolean
  phase: PublishPhase
}

export interface UseSaveWizardArgs {
  initialStep: number
  /** 编辑模式：开局的试卷 id */
  paperId?: number
  /** 编辑模式：回填内容；新建模式不传 */
  draft?: PaperDraft
}

export const useSaveWizard = ({
  initialStep,
  paperId,
  draft,
}: UseSaveWizardArgs) => {
  const queryClient = useQueryClient()

  const [state, updateState] = useImmer<WizardState>(() => ({
    step: initialStep,
    draft: draft ?? EMPTY_DRAFT,
    paperId,
    published: false,
    phase: 'idle',
  }))

  /** 就地合并更新 —— immer 直接改字段，不必手写 spread */
  const patch = useCallback(
    (p: Partial<WizardState>) => {
      updateState((d) => {
        Object.assign(d, p)
      })
    },
    [updateState],
  )

  const saveInfo = useMutation({
    mutationFn: (body: PaperSaveInput) =>
      api.paperController.savePaperV2({ body }),
  })
  const publishPaper = useMutation({
    mutationFn: (id: number) => api.paperController.publishPaper({ id }),
  })

  /** 校验 + 保存基本信息。成功返回试卷 id；校验失败/请求失败返回 undefined（已 toast） */
  const persistInfo = useCallback(async (): Promise<number | undefined> => {
    const checked = infoSchema.safeParse({
      name: state.draft.name,
      categoryId: state.draft.categoryId,
    })
    if (!checked.success) {
      toast.error(checked.error.issues[0].message)
      return undefined
    }

    const currentId = state.paperId
    try {
      const res = await saveInfo.mutateAsync({
        id: currentId,
        name: state.draft.name.trim(),
        description: state.draft.description,
        categoryId: state.draft.categoryId!,
        participateMode: state.draft.participateMode,
      })
      if (currentId == null) patch({ paperId: res.data })
      void queryClient.invalidateQueries({ queryKey: ['listPapers'] })
      if (currentId != null) {
        void queryClient.invalidateQueries({
          queryKey: ['paperDetail', currentId],
        })
      }
      return res.data
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '试卷信息保存失败')
      return undefined
    }
  }, [state.draft, state.paperId, saveInfo, queryClient, patch])

  /** 第 0 步 →「设计试卷」：先落库，成功才前进 */
  const goDesign = useCallback(async () => {
    const id = await persistInfo()
    if (id == null) return
    patch({ step: 1 })
  }, [persistInfo, patch])

  /**
   * 第 1 步 →「发布考试」：先确认有题目，再弹考试设置。
   * 后端 `POST /paper/{id}/publish` 有前置检查（没有设置行会 422），所以必须先配设置。
   */
  const goPublish = useCallback(async () => {
    const id = state.paperId
    if (id == null) return
    if (state.published) {
      patch({ step: 2 })
      return
    }
    try {
      const { data: questions } = await api.paperController.getPaperQuestions({
        id,
      })
      if (!questions.length) {
        toast.error('请先添加试题')
        return
      }
    } catch {
      toast.error('查询试题失败')
      return
    }
    patch({ phase: 'settings' })
  }, [state.paperId, state.published, patch])

  /** 考试设置保存成功 → 真正发发布请求（失败要把错误报出来，不能静默） */
  const publish = useCallback(async () => {
    const id = state.paperId
    if (id == null) return
    patch({ phase: 'publishing' })
    try {
      await publishPaper.mutateAsync(id)
      void queryClient.invalidateQueries({ queryKey: ['listPapers'] })
      void queryClient.invalidateQueries({ queryKey: ['paperDetail', id] })
      toast.success('试卷发布成功')
      patch({ published: true, phase: 'idle', step: 2 })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '试卷发布失败')
      patch({ phase: 'idle' })
    }
  }, [state.paperId, publishPaper, queryClient, patch])

  /**
   * 步骤条点击。
   *
   * - **往回退**：纯 UI，直接切步骤。
   * - **往前走**：不能只改 step —— 前进意味着要落库/校验，所以按当前步骤走对应的显式动作：
   *   第 0 步先保存基本信息（`goDesign`），第 1 步先确认有题目再弹考试设置（`goPublish`）。
   *
   * 头部那两个按钮（「保存&设计试卷」/「发布试卷」）走的是同一批动作，两条入口等价。
   */
  const goToStep = useCallback(
    (index: number) => {
      if (index === state.step) return
      if (index < state.step) {
        patch({ step: index })
        return
      }
      if (state.step === 0) {
        void goDesign()
        return
      }
      if (index === 2) {
        void goPublish()
        return
      }
      patch({ step: index })
    },
    [state.step, goDesign, goPublish, patch],
  )

  return {
    state,
    /** 任一写请求在跑 —— 给按钮置灰 */
    busy:
      saveInfo.isPending ||
      publishPaper.isPending ||
      state.phase === 'publishing',
    actions: {
      patchDraft: (p: Partial<PaperDraft>) => {
        updateState((d) => {
          Object.assign(d.draft, p)
        })
      },
      goDesign,
      goPublish,
      publish,
      goToStep,
      cancelSettings: () => patch({ phase: 'idle' }),
    },
  }
}
