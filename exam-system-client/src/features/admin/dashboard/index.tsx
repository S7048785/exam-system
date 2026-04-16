import { ChartAreaInteractive } from '#/components/chart-area-interactive.tsx'
import { DataTable } from '#/components/data-table.tsx'
import { SectionCards } from '#/components/section-cards.tsx'
import data from '#/lib/data.json'

export default function DashboardPage() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  )
}
