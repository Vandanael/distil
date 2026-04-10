'use client'

import { useReducer, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { StepInterests } from './steps/StepInterests'
import { StepSources } from './steps/StepSources'
import { StepRythme } from './steps/StepRythme'
import { StepSerendipity } from './steps/StepSerendipity'
import { StepRecap } from './steps/StepRecap'
import { createProfile } from '../actions'

type WizardState = {
  step: 1 | 2 | 3 | 4 | 5
  interests: string[]
  sources: string[]
  dailyCap: number
  serendipityQuota: number
}

type WizardAction =
  | { type: 'SET_INTERESTS'; interests: string[] }
  | { type: 'SET_SOURCES'; sources: string[] }
  | { type: 'SET_DAILY_CAP'; cap: number }
  | { type: 'SET_SERENDIPITY'; quota: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }

const INITIAL_STATE: WizardState = {
  step: 1,
  interests: [],
  sources: [],
  dailyCap: 10,
  serendipityQuota: 0.15,
}

const TOTAL_STEPS = 5

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_INTERESTS':
      return { ...state, interests: action.interests }
    case 'SET_SOURCES':
      return { ...state, sources: action.sources }
    case 'SET_DAILY_CAP':
      return { ...state, dailyCap: action.cap }
    case 'SET_SERENDIPITY':
      return { ...state, serendipityQuota: action.quota }
    case 'NEXT':
      return state.step < TOTAL_STEPS
        ? { ...state, step: (state.step + 1) as WizardState['step'] }
        : state
    case 'PREV':
      return state.step > 1
        ? { ...state, step: (state.step - 1) as WizardState['step'] }
        : state
  }
}

export default function WizardPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const [isPending, startTransition] = useTransition()

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
        <div className="space-y-2">
          <div className="flex justify-between font-[family-name:var(--font-geist)] text-xs text-muted-foreground">
            <span>Etape {state.step} sur {TOTAL_STEPS}</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
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
              onClick={() => dispatch({ type: 'PREV' })}
              disabled={isPending}
              className="flex-1"
              data-testid="wizard-prev"
            >
              Precedent
            </Button>
          )}
          {!isLastStep ? (
            <Button
              type="button"
              onClick={() => dispatch({ type: 'NEXT' })}
              disabled={isPending}
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
              {isPending ? 'Creation du profil...' : 'Demarrer Distil'}
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
