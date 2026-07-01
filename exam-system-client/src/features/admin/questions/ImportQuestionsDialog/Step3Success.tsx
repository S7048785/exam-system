import { CheckCircle } from 'lucide-react'

interface Step3SuccessProps {
  count: number
}

export default function Step3Success({ count }: Step3SuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <CheckCircle className="mb-4 h-16 w-16 text-green-600" />
      <h3 className="mb-2 text-lg font-medium">导入成功！</h3>
      <p className="text-muted-foreground text-sm">成功导入 {count} 道题目</p>
    </div>
  )
}
