import {CheckCircle} from 'lucide-react'

interface Step3SuccessProps {
  count: number
}

export default function Step3Success({ count }: Step3SuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
      <h3 className="text-lg font-medium mb-2">导入成功！</h3>
      <p className="text-sm text-muted-foreground">成功导入 {count} 道题目</p>
    </div>
  )
}
