import { describe, it, expect } from 'vitest'
import { wizardReducer, INITIAL_STATE, TOTAL_STEPS, type WizardState } from './reducer'

describe('wizardReducer', () => {
  describe('navigation', () => {
    it('NEXT incremente le step', () => {
      const s = wizardReducer(INITIAL_STATE, { type: 'NEXT' })
      expect(s.step).toBe(2)
    })

    it('NEXT ne depasse pas le step 5', () => {
      const at5: WizardState = { ...INITIAL_STATE, step: TOTAL_STEPS }
      const s = wizardReducer(at5, { type: 'NEXT' })
      expect(s.step).toBe(TOTAL_STEPS)
    })

    it('PREV decremente le step', () => {
      const at3: WizardState = { ...INITIAL_STATE, step: 3 }
      const s = wizardReducer(at3, { type: 'PREV' })
      expect(s.step).toBe(2)
    })

    it('PREV ne descend pas en dessous de 1', () => {
      const s = wizardReducer(INITIAL_STATE, { type: 'PREV' })
      expect(s.step).toBe(1)
    })

    it('parcours complet step 1 -> 5', () => {
      let s = INITIAL_STATE
      for (let i = 1; i < TOTAL_STEPS; i++) {
        s = wizardReducer(s, { type: 'NEXT' })
      }
      expect(s.step).toBe(5)
    })
  })

  describe('donnees', () => {
    it('SET_INTERESTS met a jour les interets sans toucher le reste', () => {
      const s = wizardReducer(INITIAL_STATE, {
        type: 'SET_INTERESTS',
        interests: ['IA', 'produit'],
      })
      expect(s.interests).toEqual(['IA', 'produit'])
      expect(s.step).toBe(INITIAL_STATE.step)
    })

    it('SET_INTERESTS accepte un tableau vide', () => {
      const with2: WizardState = { ...INITIAL_STATE, interests: ['IA'] }
      const s = wizardReducer(with2, { type: 'SET_INTERESTS', interests: [] })
      expect(s.interests).toEqual([])
    })

    it('SET_SOURCES met a jour les sources', () => {
      const s = wizardReducer(INITIAL_STATE, { type: 'SET_SOURCES', sources: ['arxiv.org'] })
      expect(s.sources).toEqual(['arxiv.org'])
    })

    it('SET_DAILY_CAP met a jour le cap', () => {
      const s = wizardReducer(INITIAL_STATE, { type: 'SET_DAILY_CAP', cap: 5 })
      expect(s.dailyCap).toBe(5)
    })

    it('SET_SERENDIPITY met a jour le quota', () => {
      const s = wizardReducer(INITIAL_STATE, { type: 'SET_SERENDIPITY', quota: 0.3 })
      expect(s.serendipityQuota).toBe(0.3)
    })

    it('les mutations sont immutables - state original inchange', () => {
      const original = { ...INITIAL_STATE }
      wizardReducer(INITIAL_STATE, { type: 'NEXT' })
      expect(INITIAL_STATE.step).toBe(original.step)
    })
  })
})
