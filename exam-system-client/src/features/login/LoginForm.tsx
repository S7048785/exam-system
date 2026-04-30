import {useEffect, useId, useRef, useState} from "react";
import {useForm} from "@tanstack/react-form";
import {toast} from "sonner";
import {Label} from "#/components/ui/label.tsx";
import {Input} from "#/components/ui/input.tsx";
import {Button} from "#/components/ui/button.tsx";
import z from "zod";
import {useLoginAction} from "#/features/login/useLoginActions.ts";
import {encryptWithPublicKey} from "#/lib/crypto";
import {api} from "#/ApiInstance.ts";
import {Lock, User} from "lucide-react";

const capUrl = import.meta.env.VITE_CAP_URL
const capSiteKey = import.meta.env.VITE_CAP_SITE_KEY

// 1. 定义 Zod Schema（建议放在组件外部避免重复创建）
const userSchema = z.object({
	username: z.string().min(4, '用户名长度不能小于4位字符'),
	password: z.string().min(6, '密码长度不能小于6位字符'),
})

export default function LoginForm() {
	const id = useId()

	const [publicKey, setPublicKey] = useState('')
	const [captchaToken, setCaptchaToken] = useState('')
	const capRef = useRef<any>(null)

	const loginMutation = useLoginAction()
	const form = useForm({
		defaultValues: {
			username: '',
			password: '',
		},
		// 2. 将 schema 传给 validators
		validators: {
			onChange: userSchema, // 实时验证
		},
		onSubmit: async ({value}) => {
			// value 的类型会自动推断为 { username: string; password: string }
			console.log(value)

			if (!captchaToken) {
				toast.warning('请先完成验证码')
				return
			}
			// 用公钥加密密码
			const encryptedPassword = await encryptWithPublicKey(value.password, publicKey)

			if (!encryptedPassword) {
				toast('密码加密失败')
				return
			}

			// 登录
			loginMutation.mutate({
				username: value.username,
				encryptedPassword,
				token: captchaToken,
			})
			if (loginMutation.isError) {
				form.resetField('password')
				setCaptchaToken('')
				capRef.current.reset()
			}
		},
	})
	// 获取公钥
	useEffect(() => {
		api.userController.getPublicKey().then((res) => {
			if (res.code === 200) {
				setPublicKey(res.data!)
			}
		})
	}, [])

	// 验证码样式
	useEffect(() => {
		const cap = document.querySelector('cap-widget')
		const sheet = new CSSStyleSheet()
		sheet.replaceSync(`
      .label {
        position: static !important;
      }
        .captcha {
        display: flex;
        justify-content: center;
    }
    `)
		if (cap) {
			cap.shadowRoot!.adoptedStyleSheets = [sheet]
		}
	}, [])

	return (
			<form onSubmit={(event) => {
				event.preventDefault()
				form.handleSubmit()
			}} className="space-y-5 ">
				<div className="space-y-4">
					<form.Field
							name="username"
							children={(field) => (
									<div className="*:not-first:mt-2">
										<Label htmlFor={`${id}-username`}>
											用户名
										</Label>
										<div className="relative">
											<Input
													id={`${id}-username`}
													className="ps-9"
													placeholder="请输入用户名"
													required
													autoComplete="current-username"
													type="text"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
											/>
											<div
													className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
												<User aria-hidden="true" size={16}/>
											</div>
										</div>

									</div>
							)
							}
					/>
					<form.Field
							name="password"
							children={(field) => (
									<div className="*:not-first:mt-2">
										<Label htmlFor={`${id}-password`}>
											密码
										</Label>
										<div className="relative">
											<Input
													id={`${id}-password`}
													autoComplete="current-password"
													placeholder="请输入密码"
													className="ps-9"
													required
													type="password"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
											/>
											<div
													className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
												<Lock aria-hidden="true" size={16}/>
											</div>
										</div>

									</div>
							)
							}
					/>
				</div>
				<div className="flex items-center space-x-8 pt-4">
					{/* @ts-ignore: 忽略 cap-widget 组件的类型检查错误 */}
					<cap-widget
							ref={capRef}
							id="cap"
							required
							data-cap-i18n-initial-state="我不是机器人"
							data-cap-i18n-solved-label="验证通过"
							data-cap-i18n-verifying-label="验证中..."
							data-cap-i18n-required-label="请验证您是人类用户"
							data-cap-api-endpoint={`${capUrl}/${capSiteKey}`}
							onsolve={(e: any) => {
								setCaptchaToken(e.detail.token)
							}}
							onerror={(e: any) => console.error(e.detail.message)}
					/>
					<Button
							className="flex-1 py-6"
							type="submit"
							disabled={loginMutation.isPending}
					>
						{loginMutation.isPending ? '登录中...' : '登录'}
					</Button>
				</div>
			</form>
	)
}