export type WizardState = {
  step: 1 | 2 | 3 | 4 | 5
  interests: string[]
  sources: string[]
  dailyCap: number
  serendipityQuota: number
}

export type WizardAction =
  | { type: 'SET_INTERESTS'; interests: string[] }
  | { type: 'SET_SOURCES'; sources: string[] }
  | { type: 'SET_DAILY_CAP'; cap: number }
  | { type: 'SET_SERENDIPITY'; quota: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }

export const TOTAL_STEPS = 5

export const INITIAL_STATE: WizardState = {
  step: 1,
  interests: [],
  sources: [],
  dailyCap: 10,
  serendipityQuota: 0.15,
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
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
      return state.step > 1 ? { ...state, step: (state.step - 1) as WizardState['step'] } : state
  }
}
