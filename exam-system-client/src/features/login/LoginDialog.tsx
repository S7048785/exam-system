import {memo, useCallback, useState} from 'react'

import {Button} from '#/components/ui/button.tsx'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '#/components/ui/dialog.tsx'
import {Tabs, TabsContent, TabsContents, TabsList, TabsTrigger,} from '@/components/animate-ui/components/animate/tabs'
import LoginForm from '#/features/login/LoginForm.tsx'
import RegisterForm from '#/features/login/RegisterForm.tsx'

function LoginDialog() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('account')

  const handleLoginSuccess = useCallback(() => {
    setOpen(false)
  }, [])

  const handleRegisterSuccess = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign in</Button>
      </DialogTrigger>
      <DialogContent
        className="px-8 py-5"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="gap-2">
          <div
            aria-hidden="true"
            className="mx-auto flex size-11 shrink-0 items-center justify-center rounded-full border"
          >
            <svg
              aria-hidden="true"
              className="stroke-zinc-800 dark:stroke-zinc-100"
              height="20"
              viewBox="0 0 32 32"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="16" cy="16" fill="none" r="12" strokeWidth="8" />
            </svg>
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">欢迎回来</DialogTitle>
            <DialogDescription className="sm:text-center">
              输入你的账号信息进行登录，并验证你不是机器人
            </DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <div className="border-0 py-0 shadow-none">
              <TabsContents className="py-6">
                <TabsContent value="account" className="flex flex-col gap-6">
                  {activeTab === 'account' ? (
                    <LoginForm onLoginSuccess={handleLoginSuccess} />
                  ) : null}
                </TabsContent>
                <TabsContent value="register" className="flex flex-col gap-6">
                  {activeTab === 'register' ? (
                    <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
                  ) : null}
                </TabsContent>
              </TabsContents>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default memo(LoginDialog)
