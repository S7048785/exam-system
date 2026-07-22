import { create } from 'zustand'

interface PaperListState {
  dialogMode: 'create' | 'edit'
  editPaperId: number | undefined
  dialogOpen: boolean
  dialogInitialStep: number
  addPaper: () => void
  editPaperAtStep: (id: number, step: number) => void
  resetDialogInitialStep: () => void
  closeDialog: () => void
  setDialogOpen: (open: boolean) => void
}

/**
 * 控制paper-list页面EditDialog组件状态
 */
export const usePaperListStore = create<PaperListState>()((set) => ({
  dialogMode: 'create',
  editPaperId: undefined,
  dialogOpen: false,
  dialogInitialStep: 0,
  addPaper: () =>
    set({
      dialogMode: 'create',
      editPaperId: undefined,
      dialogOpen: true,
      dialogInitialStep: 0,
    }),
  editPaperAtStep: (id: number, step: number) =>
    set({
      dialogMode: 'edit',
      editPaperId: id,
      dialogOpen: true,
      dialogInitialStep: step,
    }),
  resetDialogInitialStep: () => set({ dialogInitialStep: 0 }),
  closeDialog: () => set({ dialogOpen: false }),
  setDialogOpen: (open: boolean) => set({ dialogOpen: open }),
}))
