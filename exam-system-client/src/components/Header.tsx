import {Link} from '@tanstack/react-router'
import {ExternalLink} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import LoginDialog from '../features/login/LoginDialog.tsx'
import {Button} from "#/components/ui/button.tsx";
import {api} from "#/ApiInstance.ts";
import useUserStore from "#/stores/user.ts";

export default function Header() {

	const user = useUserStore(state => state.user)

	const onLogout = () => {
		api.userController.logout()
	}
	return (
			<header className="sticky top-0 z-50 border-b border-(--line) bg-(--header-bg) px-4 backdrop-blur-lg">
				<nav className="page-wrap flex flex-wrap justify-between items-center gap-x-3 gap-y-2 py-3 sm:py-4">
					<div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
						<a
								href="https://github.com/S7048785"
								target="_blank"
								rel="noreferrer"
								className="hidden rounded-xl p-2 text-(--sea-ink-soft) transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink) sm:block"
						>
							<span className="sr-only">Go to TanStack GitHub</span>
							<svg viewBox="0 0 16 16" aria-hidden="true" width="24" height="24">
								<path
										fill="currentColor"
										d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
								/>
							</svg>
						</a>

						<ThemeToggle/>
					</div>
					<div
							className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
						<Link
								to="/"
								className="nav-link"
								activeProps={{className: 'nav-link is-active'}}
						>
							Home
						</Link>
						<Link
								to="/about"
								className="nav-link"
								activeProps={{className: 'nav-link is-active'}}
						>
							About
						</Link>
						<a
								href="https://tanstack.com/start/latest/docs/framework/react/overview"
								className="nav-link"
								target="_blank"
								rel="noreferrer"
						>
							Docs
						</a>
						<details className="relative w-full sm:w-auto">
							<summary className="nav-link list-none cursor-pointer">
								Demos
							</summary>
							<div
									className="mt-2 min-w-56 rounded-xl border border-[var(--line)] bg-[var(--header-bg)] p-2 shadow-lg sm:absolute sm:right-0">
								<a
										href="/demo/tanstack-query"
										className="block rounded-lg px-3 py-2 text-sm text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
								>
									TanStack Query
								</a>
							</div>
						</details>

						{user?.role === 'admin' && (
								<>

									<Link to="/admin/banners" className="nav-link gap-1">
										管理员后台
										<ExternalLink size={16} className="mb-0.5"/>
									</Link>
								</>
						)}
						{user ? (<>
							<a href="/exam/list" className="nav-link">
								考试入口
							</a>
							<a href="/post" className="nav-link">
								考试排行榜
							</a>
							<Button onClick={() => onLogout()}>退出登录</Button>
						</>) : (
								<LoginDialog/>
						)}
					</div>
				</nav>
			</header>
	)
}
