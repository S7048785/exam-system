import { create } from 'zustand'

interface PaperListState {
  dialogMode: 'create' | 'edit'
  editPaperId: number | undefined
  dialogOpen: boolean
  addPaper: () => void
  editPaper: (id: number) => void
  closeDialog: () => void
  setDialogOpen: (open: boolean) => void
}
export const usePaperListStore = create<PaperListState>()((set) => ({
  dialogMode: 'create',
  editPaperId: undefined,
  dialogOpen: false,
  addPaper: () =>
    set({ dialogMode: 'create', editPaperId: undefined, dialogOpen: true }),
  editPaper: (id: number) =>
    set({ dialogMode: 'edit', editPaperId: id, dialogOpen: true }),
  closeDialog: () => set({ dialogOpen: false }),
  setDialogOpen: (open: boolean) => set({ dialogOpen: open }),
}))
