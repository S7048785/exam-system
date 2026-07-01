import { createFileRoute } from '@tanstack/react-router'
import { ReactSkinview3d } from 'react-skinview3d'
import { WalkingAnimation } from 'skinview3d'

export const Route = createFileRoute('/admin/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}
      >
        <ReactSkinview3d
          skinUrl="/my-skin.png" // 或你的皮肤PNG URL
          // capeUrl="https://你的披风URL.png"          // 可选
          width={400}
          height={500}
          options={{
            animation: new WalkingAnimation(),
            model: 'default',
            zoom: 1.0,
          }}
        />
      </div>
    </div>
  )
}
