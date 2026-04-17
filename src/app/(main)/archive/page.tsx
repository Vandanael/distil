import { redirect } from 'next/navigation'

export default function ArchiveRedirect() {
  redirect('/library?tab=saved')
}
