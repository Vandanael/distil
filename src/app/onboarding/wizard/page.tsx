'use client'

import { useReducer, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { StepInterests } from './steps/StepInterests'
import { StepSources } from './steps/StepSources'
import { StepRythme } from './steps/StepRythme'
import { StepSerendipity } from './steps/StepSerendipity'
import { StepRecap } from './steps/StepRecap'
import { createProfile } from '../actions'
import { wizardReducer, INITIAL_STATE, TOTAL_STEPS } from './reducer'

export default function WizardPage() {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE)
  const [isPending, startTransition] = useTransition()
  const [isNavigating, startNavTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      await createProfile({
        method: 'wizard',
        interests: state.interests,
        pinned_sources: state.sources,
        daily_cap: state.dailyCap,
        serendipity_quota: state.serendipityQuota,
      })
    })
  }

  const isLastStep = state.step === TOTAL_STEPS

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Indicateur de progression */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="font-ui text-xs uppercase tracking-wider text-accent">Wizard</p>
            <span className="font-ui text-xs tabular-nums text-muted-foreground">
              {state.step} / {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-px bg-border overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(state.step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Contenu de l'etape */}
        <div data-testid={`wizard-step-${state.step}`}>
          {state.step === 1 && (
            <StepInterests
              interests={state.interests}
              onChange={(interests) => dispatch({ type: 'SET_INTERESTS', interests })}
            />
          )}
          {state.step === 2 && (
            <StepSources
              sources={state.sources}
              onChange={(sources) => dispatch({ type: 'SET_SOURCES', sources })}
            />
          )}
          {state.step === 3 && (
            <StepRythme
              dailyCap={state.dailyCap}
              onChange={(cap) => dispatch({ type: 'SET_DAILY_CAP', cap })}
            />
          )}
          {state.step === 4 && (
            <StepSerendipity
              quota={state.serendipityQuota}
              onChange={(quota) => dispatch({ type: 'SET_SERENDIPITY', quota })}
            />
          )}
          {state.step === 5 && (
            <StepRecap
              interests={state.interests}
              sources={state.sources}
              dailyCap={state.dailyCap}
              serendipityQuota={state.serendipityQuota}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {state.step > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => startNavTransition(() => dispatch({ type: 'PREV' }))}
              disabled={isPending || isNavigating}
              className="flex-1"
              data-testid="wizard-prev"
            >
              Précédent
            </Button>
          )}
          {!isLastStep ? (
            <Button
              type="button"
              onClick={() => startNavTransition(() => dispatch({ type: 'NEXT' }))}
              disabled={isPending || isNavigating}
              className="flex-1"
              data-testid="wizard-next"
            >
              Suivant
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1"
              data-testid="wizard-submit"
            >
              {isPending ? 'Création du profil...' : 'Démarrer Distil'}
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
