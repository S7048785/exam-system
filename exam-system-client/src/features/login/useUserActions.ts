import {useMutation} from '@tanstack/react-query'
import {api} from '#/ApiInstance.ts'
import {toast} from 'sonner'
import type {UserLoginInput, UserRegisterInput} from "#/__generated/model/static";
import useUserStore from "#/stores/user.ts";

export const useLoginAction = () => {
	return useMutation({
		mutationFn: (body: UserLoginInput) => api.userController.loginUser({body}),
		onSuccess: () => {
			toast.success('登录成功')
		},
		onError: (error: any) => {
			toast.error(error.message || '网络错误')
		},
	})
}

export const useRegisterAction = () => {
	return useMutation({
		mutationFn: (body: UserRegisterInput) => api.userController.registerUser({body}),
		onSuccess: () => {
			toast.success('注册成功')
		},
		onError: (error: any) => {
			toast.error(error.message || '网络错误')
		},
	})
}

export const useEmailAction = () => {
	return useMutation({
		mutationFn: (email: string) => api.userController.sendCaptcha({email}),
		onSuccess: () => {
			toast.success('验证码发送成功')
		},
		onError: (error: any) => {
			toast.error(error.message || '网络错误')
		},
	})
}

export const useGetInfoAction = () => {
	const {login} = useUserStore()
	return useMutation({
		mutationFn: () => api.userController.getUserInfo(),
		onSuccess: (data) => {
			if (data.data !== null) {
				const user = data.data!
				login({
					email: user.email,
					realName: user.realName,
					role: user.role,
					id: user.id,
				})
			}
		},
		onError: (error: any) => {
			toast.error('获取用户信息失败：' + (error.message || '网络错误'))
		},
	})
}
