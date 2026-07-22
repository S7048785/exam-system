import { useMutation } from '@tanstack/react-query'
import { api } from '#/ApiInstance.ts'
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
