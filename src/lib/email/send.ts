import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY non configure')
    resend = new Resend(key)
  }
  return resend
}

type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const from = process.env.RESEND_FROM ?? 'Distil <digest@distil.app>'

  const { error } = await getResend().emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
}
