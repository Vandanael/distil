import { redirect } from 'next/navigation'

export default function RejectedRedirect() {
  redirect('/library?tab=filtered')
}
