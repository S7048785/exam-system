import Footer from '#/components/Footer'
import Header from '#/components/Header'
import {createFileRoute, Outlet} from '@tanstack/react-router'
import {useEffect} from "react";
import {useGetInfoAction} from "#/features/login/useUserActions.ts";
import {api} from "#/ApiInstance.ts";
import useUserStore from "#/stores/user.ts";

export const Route = createFileRoute('/_public')({
  component: RouteComponent,
  beforeLoad: async () => {
    const res = await api.userController.getUserInfo()
    if (res.data) {
      useUserStore.getState().login(res.data)
    }
  }
})

function RouteComponent() {
  const {mutate} = useGetInfoAction()

  useEffect(() => {
    mutate()
  }, [])
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
