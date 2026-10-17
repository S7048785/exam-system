import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import { XIcon } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { usePaperListStore } from '#/stores/paper-list.ts'
import {
  paperCategoryTreeQueryOptions,
  paperQueries,
} from '#/features/console/papers/paperQueries.ts'
import Loading from '#/components/Loading.tsx'
import StepIndicator from '#/features/console/papers/components/wizard/StepIndicator.tsx'
import StepBasicInfo from '#/features/console/papers/components/wizard/StepBasicInfo.tsx'
import StepDesignPaper from '#/features/console/papers/components/wizard/StepDesignPaper/StepDesignPaper.tsx'
import StepPublishExam from '#/features/console/papers/components/wizard/StepPublishExam.tsx'
import ExamSettingsDialog from './ExamSettingsDialog.tsx'
import { toDraft, useSaveWizard, type PaperDraft } from './useSaveWizard.ts'

const STEPS = [
  { title: '考试信息', description: '编辑试卷基本信息' },
  { title: '设计试卷', description: '选择试卷题目' },
  { title: '发布考试', description: '发布试卷并获取考试链接' },
]

/**
 * 新增 / 编辑试卷向导。
 *
 * 相比旧实现刻意做到这几点：
 *
 * - **关闭即卸载**：Dialog 关掉时 Radix 会卸载 Portal，向导状态随之消失 ——
 *   不需要"打开时重置"的 effect。旧实现那个 `useEffect(..., [dialogOpen, dialogMode, detailData])`
 *   一旦详情刷新就会清空表单、打回初始步骤、连刚创建的 `paperId` 一起丢。
 * - **`key` 决定生命周期**：新建固定 `create`，编辑用 `edit-{paperId}`；换卷或换模式即重新初始化。
 * - **详情没到不初始化**：编辑模式先渲染 Loading，等详情到了再挂载向导，于是 `useSaveWizard`
 *   能一次性拿到回填值，全程不需要 effect 轮询 `detailData`。
 * - **保存显式化**：切换步骤是纯 UI，写库只发生在「下一步 / 发布」触发的动作里。
 *
 * ⚠️ `StepIndicator` / `StepBasicInfo` / `StepDesignPaper` / `StepPublishExam`
 * 都在 `papers/components/wizard/`（原先挂在 `EditDialog/` 下，那个目录已删除）。
 */
export default function SaveDialog() {
  const {
    dialogOpen,
    dialogMode,
    editPaperId,
    dialogInitialStep,
    setDialogOpen,
  } = usePaperListStore(
    useShallow((state) => ({
      dialogOpen: state.dialogOpen,
      dialogMode: state.dialogMode,
      editPaperId: state.editPaperId,
      dialogInitialStep: state.dialogInitialStep,
      setDialogOpen: state.setDialogOpen,
    })),
  )

  // 编辑模式才查详情（新增模式下 enabled 为 false，不会发请求）
  const { data: detailData } = useQuery(
    paperQueries.detail(
      editPaperId!,
      dialogOpen && dialogMode === 'edit' && !!editPaperId,
    ),
  )
  const detail = detailData?.data

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent
        showCloseButton={false}
        className="flex h-179 w-[95%] max-w-none flex-col overflow-hidden p-0"
      >
        {dialogMode === 'edit' && detail == null ? (
          <Loading />
        ) : (
          <WizardContent
            key={dialogMode === 'edit' ? `edit-${editPaperId}` : 'create'}
            initialStep={dialogInitialStep}
            initialPaperId={dialogMode === 'edit' ? editPaperId : undefined}
            initialDraft={detail ? toDraft(detail) : undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface WizardContentProps {
  initialStep: number
  initialPaperId?: number
  initialDraft?: PaperDraft
}

function WizardContent({
  initialStep,
  initialPaperId,
  initialDraft,
}: WizardContentProps) {
  const { state, busy, actions } = useSaveWizard({
    initialStep,
    paperId: initialPaperId,
    draft: initialDraft,
  })
  const setDialogOpen = usePaperListStore((s) => s.setDialogOpen)

  // 第 0 步的分类树
  const { data: treeData } = useQuery(paperCategoryTreeQueryOptions)
  const categoryTree = treeData?.data ?? []

  return (
    <>
      <DialogHeader className="shrink-0">
        <DialogTitle className="flex flex-row items-center justify-between">
          <div className="text-base">
            {initialPaperId ? initialDraft?.name : '新增试卷'}
          </div>
          <StepIndicator
            steps={STEPS}
            currentStep={state.step}
            onStepClick={actions.goToStep}
          />
          <div className="flex items-center gap-3">
            {/* 第 0 步：保存基本信息并进入「设计试卷」（步骤条只允许后退，前进必须走这个按钮） */}
            {state.step === 0 && (
              <Button
                size="sm"
                onClick={() => void actions.goDesign()}
                disabled={busy}
              >
                {busy ? '保存中…' : '保存&设计试卷'}
              </Button>
            )}
            {/* 「设计试卷」这一步才有发布入口 */}
            {state.step === 1 && (
              <Button
                size="sm"
                onClick={() => void actions.goPublish()}
                disabled={busy}
              >
                {busy ? '发布中…' : '发布试卷'}
              </Button>
            )}
            <XIcon
              onClick={() => setDialogOpen(false)}
              size={24}
              className={'cursor-pointer hover:text-blue-400'}
            />
          </div>
        </DialogTitle>
      </DialogHeader>

      <DialogDescription className="sr-only">
        {STEPS[state.step].description}
      </DialogDescription>

      <div className="bg-muted/90 flex-1 overflow-hidden p-4">
        {state.step === 0 ? (
          <StepBasicInfo
            name={state.draft.name}
            categoryId={state.draft.categoryId}
            description={state.draft.description}
            participateMode={state.draft.participateMode}
            categoryTree={categoryTree}
            onNameChange={(v) => actions.patchDraft({ name: v })}
            onCategoryChange={(v) => actions.patchDraft({ categoryId: v })}
            onDescriptionChange={(v) => actions.patchDraft({ description: v })}
            onParticipateModeChange={(v) =>
              actions.patchDraft({ participateMode: v })
            }
          />
        ) : state.step === 1 ? (
          <StepDesignPaper paperId={state.paperId!} />
        ) : (
          <StepPublishExam
            paperId={state.paperId!}
            description={state.draft.description}
          />
        )}
      </div>

      {/* 发布前必须先配考试设置 —— 后端 publish 有前置检查，没有设置行会 422 */}
      {state.paperId != null && (
        <ExamSettingsDialog
          paperId={state.paperId}
          open={state.phase === 'settings'}
          onOpenChange={(open) => {
            if (!open) actions.cancelSettings()
          }}
          onSaved={() => void actions.publish()}
        />
      )}
    </>
  )
}
