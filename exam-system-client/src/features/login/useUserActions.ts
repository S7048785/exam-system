import { useMutation } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import { toast } from 'sonner'
import type {
  UserLoginInput,
  UserRegisterInput,
} from '#/__generated/model/static'

export const useLoginAction = () => {
  return useMutation({
    mutationFn: (body: UserLoginInput) =>
      api.userController.loginUser({ body }),
    onSuccess: () => {
      toast.success('登录成功')
    },
    // onError: (error: any) => {
    //   toast.error(error.message || '网络错误')
    // },
  })
}

export const useRegisterAction = () => {
  return useMutation({
    mutationFn: (body: UserRegisterInput) =>
      api.userController.registerUser({ body }),
    onSuccess: () => {
      toast.success('注册成功')
    },
    // onError: (error: any) => {
    //   toast.error(error.message || '网络错误')
    // },
  })
}

export const useEmailAction = () => {
  return useMutation({
    mutationFn: (email: string) => api.userController.sendCaptcha({ email }),
    onSuccess: () => {
      toast.success('验证码发送成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '网络错误')
    },
  })
}
