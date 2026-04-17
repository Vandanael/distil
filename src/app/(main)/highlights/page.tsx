import { redirect } from 'next/navigation'

export default function HighlightsRedirect() {
  redirect('/library?tab=highlights')
}
