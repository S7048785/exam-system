import {SiteHeader} from '@/components/site-header'
import {SidebarInset, SidebarProvider} from '@/components/ui/sidebar'
import {AppSidebar} from '@/features/admin/app-sidebar'
import {Outlet} from '@tanstack/react-router'
import React from 'react'

export default function AdminPage() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:p-4 overflow-hidden">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
