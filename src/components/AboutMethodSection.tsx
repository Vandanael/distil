'use client'

import { useLocale } from '@/lib/i18n/context'

export function AboutMethodSection() {
  const { t } = useLocale()

  const steps = [
    { title: t.about.methodStep1Title, text: t.about.methodStep1Text },
    { title: t.about.methodStep2Title, text: t.about.methodStep2Text },
    { title: t.about.methodStep3Title, text: t.about.methodStep3Text },
    { title: t.about.methodStep4Title, text: t.about.methodStep4Text },
    { title: t.about.methodStep5Title, text: t.about.methodStep5Text },
  ]

  return (
    <section className="mb-14 md:mb-16 border-t border-border pt-8 md:pt-10">
      <h2 className="font-display text-4xl md:text-5xl text-foreground leading-[0.95] tracking-[-0.01em] mb-4 md:mb-6 text-balance">
        {t.about.methodTitle}
      </h2>
      <p className="font-body text-[16px] text-muted-foreground leading-[1.6] mb-8 text-pretty">
        {t.about.methodLede}
      </p>
      <ol className="space-y-8 md:space-y-10">
        {steps.map((step, i) => (
          <li key={i}>
            <h3 className="font-display text-2xl md:text-3xl text-accent leading-[1.15] mb-2">
              {step.title}
            </h3>
            <p className="font-body text-[16px] text-muted-foreground leading-[1.6] text-pretty">
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
