import { notFound } from 'next/navigation'
import { DevDashboard } from './DevDashboard'

export default function DevPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <DevDashboard />
}
