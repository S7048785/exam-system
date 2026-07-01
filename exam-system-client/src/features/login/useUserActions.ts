import { useMutation } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
import { toast } from 'sonner'
import type { UserLoginReq, UserRegisterReq } from '#/__generated/model/static'

export const useLoginAction = () => {
  return useMutation({
    mutationFn: async (body: UserLoginReq) =>
      api.userController.loginUser({ body }),
  })
}

export const useRegisterAction = () => {
  return useMutation({
    mutationFn: (body: UserRegisterReq) =>
      api.userController.registerUser({ body }),
  })
}

export const useEmailAction = () => {
  return useMutation({
    mutationFn: ({ email, captcha }: { email: string; captcha: string }) =>
      api.userController.sendCaptcha({ email, captcha }),
    onSuccess: () => {
      toast.success('验证码发送成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '网络错误')
    },
  })
}
