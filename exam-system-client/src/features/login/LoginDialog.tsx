import {useState} from 'react'

import {Button} from '#/components/ui/button.tsx'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '#/components/ui/dialog.tsx'
import 'cap-widget'
import LoginForm from "#/features/login/LoginForm.tsx";

export default function LoginDialog() {
	const [open, setOpen] = useState(false)
	return (
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button variant="outline">Sign in</Button>
				</DialogTrigger>
				<DialogContent className="px-8 py-5" // 阻止点击背景关闭
											 onPointerDownOutside={(e) => e.preventDefault()}>
					<div className="gap-2">
						<div
								aria-hidden="true"
								className="flex size-11 shrink-0 items-center justify-center mx-auto rounded-full border"
						>
							<svg
									aria-hidden="true"
									className="stroke-zinc-800 dark:stroke-zinc-100"
									height="20"
									viewBox="0 0 32 32"
									width="20"
									xmlns="http://www.w3.org/2000/svg"
							>
								<circle cx="16" cy="16" fill="none" r="12" strokeWidth="8"/>
							</svg>
						</div>
						<DialogHeader>
							<DialogTitle className="sm:text-center">欢迎回来</DialogTitle>
							<DialogDescription className="sm:text-center">
								输入你的账号信息进行登录，并验证你不是机器人
							</DialogDescription>
						</DialogHeader>
						<LoginForm/>
					</div>
				</DialogContent>
			</Dialog>
	)
}
