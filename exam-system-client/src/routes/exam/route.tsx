import {createFileRoute, redirect} from '@tanstack/react-router'
import useUserStore from "#/stores/user.ts";

export const Route = createFileRoute('/exam')({
  component: RouteComponent,
	beforeLoad: () => {
		if (!useUserStore.getState().isLoggedIn) {
			throw redirect({to: '/'})
		}
	}
})

function RouteComponent() {
  return <div>Hello "/exam"!</div>
}
