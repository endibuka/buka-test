'use client'

import OrdersTool from '@/components/OrdersTool'
import DashboardLayout from '@/components/DashboardLayout'

export default function Home() {
  return (
    <DashboardLayout>
      <OrdersTool />
    </DashboardLayout>
  )
}
