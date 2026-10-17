import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import {
  getSavedStudentName,
  saveStudentName,
} from '#/features/exam/entry/studentNameStorage.ts'
import { studentNameSchema } from './utils.ts'
import type { WindowPhase } from './utils.ts'

/** 免登录考试的按钮文案 —— 只有时间窗一个维度（没有「我」的记录可看） */
const LABEL: Record<WindowPhase, string> = {
  NOT_STARTED: '考试未开始',
  OPEN: '开始考试',
  ENDED: '考试已结束',
}

interface AnonymousEntryProps {
  window: WindowPhase
  submitting: boolean
  /** 姓名已过校验；发什么请求由父组件负责 */
  onStart: (studentName: string) => void
}

/**
 * 免登录考试的入场区：姓名必填（1~50 字），姓名取自考生手填。
 *
 * 考生自己填的姓名是这个模式下唯一的身份标识，所以填过就记到 localStorage，
 * 下次进别的免登录考试自动带上。入口页是 `ssr: false`，初始值可以直接读本地存储
 * （`getSavedStudentName` 内部已兜住 SSR / 隐私模式）。
 */
export function AnonymousEntry({
  window,
  submitting,
  onStart,
}: AnonymousEntryProps) {
  const [studentName, setStudentName] = useState(getSavedStudentName)
  // 姓名校验的即时提示（由 zod 产生），打字即清
  const [nameError, setNameError] = useState('')

  const handleStart = () => {
    const parsed = studentNameSchema.safeParse(studentName)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? '姓名不合法'
      setNameError(message)
      toast.error(message)
      return
    }
    // 存 trim 后的值
    saveStudentName(parsed.data)
    onStart(parsed.data)
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="studentName">
          姓名<span className="text-destructive ml-0.5">*</span>
        </Label>
        <Input
          id="studentName"
          value={studentName}
          onChange={(e) => {
            setStudentName(e.target.value)
            // 一开始打字就把上一轮的错误提示清掉
            if (nameError) setNameError('')
          }}
          placeholder="请输入你的姓名"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? 'studentName-error' : undefined}
        />
        {nameError && (
          <p id="studentName-error" className="text-destructive text-sm">
            {nameError}
          </p>
        )}
      </div>

      <Button
        className="h-11 w-full text-base"
        onClick={handleStart}
        disabled={window !== 'OPEN' || submitting}
      >
        {submitting ? '正在开考…' : LABEL[window]}
      </Button>
    </>
  )
}
