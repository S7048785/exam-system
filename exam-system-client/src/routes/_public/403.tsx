import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/403')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 space-y-6 text-center">
      <img
        src="https://gitee.com/static/errors/images/403.png"
        alt=""
        className="mx-auto"
      />
      <div className="text-neutral-10 text-lg">你的访问受限!</div>
      <div className="text-neutral-9">
        服务器拒绝处理您的请求！您可能没有访问此操作的权限，
        <Link to="/">点击这里</Link>
        返回首页
      </div>

      <div className="text-neutral-7 text-left text-base">
        <div>也可能是以下原因导致您没有权限</div>
        <div>1. 没有登录，请登录后查看</div>
        <div>
          2. 资源属于企业，企业用户因安全策略被企业屏蔽，请联系企业管理员
        </div>
        <div>
          3. 项目因违规被 Gitee 屏蔽，请联系项目拥有者查看项目是否被屏蔽
        </div>
        <div>4. 仓库处于“暂停”或“关闭”状态，功能被限制使用</div>
      </div>
    </div>
  )
}
