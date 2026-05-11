import {createFileRoute, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/exam')({
  beforeLoad: ({context}) => {
    const {user} = context
    if (!user) {
      throw redirect({to: '/'})
    }
  }
})
