import { useEffect } from 'react'
import { useRouter} from '@tanstack/react-router'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'
import {flushSync} from "react-dom"; // 别忘了引入 CSS

// 配置 nprogress（可选）
nprogress.configure({ showSpinner: false, speed: 400 })

export function ProgressBar() {
	const router = useRouter()

	useEffect(() => {
		// 订阅路由事件
		const unsubscribe = router.subscribe('onBeforeLoad', () => {
			// 强制立即执行 DOM 操作，不等待 React 的下一次 tick
			flushSync(() => {
				nprogress.start()
			})
		})

		// 路由加载完成或加载后的清理
		const done = () => nprogress.done()

		// 监听加载完成和加载错误
		const subLoad = router.subscribe('onLoad', done)

		return () => {
			unsubscribe()
			subLoad()
			nprogress.done()
		}
	}, [router])

	return null // 该组件只负责逻辑，不渲染 HTML
}
