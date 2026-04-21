import { describe, it, expect } from 'vitest'
import { truncateToExtract } from './extract'

function paragraph(wordCount: number, marker = 'mot'): string {
  const words = Array.from({ length: wordCount }, (_, i) => `${marker}${i}`).join(' ')
  return `<p>${words}</p>`
}

describe('truncateToExtract', () => {
  it('article 1000 mots, ratio 0.3 : coupe en fin de paragraphe autour de 300 mots', () => {
    // 10 paragraphes de 100 mots
    const html = Array.from({ length: 10 }, () => paragraph(100)).join('')
    const out = truncateToExtract(html, 0.3, 150)

    expect(out.originalWordCount).toBe(1000)
    expect(out.truncated).toBe(true)
    // 3 paragraphes de 100 mots suffisent pour atteindre 300 (cible)
    expect(out.extractWordCount).toBe(300)
    expect(out.html.match(/<p>/g)?.length).toBe(3)
  })

  it('article 400 mots : plancher minWords 150 respecte quand ratio * total < min', () => {
    // 4 paragraphes de 100 mots => 400 mots total, 0.3 * 400 = 120 (< 150)
    const html = Array.from({ length: 4 }, () => paragraph(100)).join('')
    const out = truncateToExtract(html, 0.3, 150)

    expect(out.originalWordCount).toBe(400)
    // 150 mots minimum => coupe apres le 2eme paragraphe (100 + 100 = 200 >= 150)
    expect(out.extractWordCount).toBeGreaterThanOrEqual(150)
    expect(out.extractWordCount).toBeLessThanOrEqual(200)
    expect(out.truncated).toBe(true)
  })

  it('article 300 mots : plafond 50% prevaut sur plancher minWords', () => {
    // 3 paragraphes de 100 mots => 300 mots. minWords 150 mais plafond 50% = 150
    const html = Array.from({ length: 3 }, () => paragraph(100)).join('')
    const out = truncateToExtract(html, 0.3, 150)

    expect(out.originalWordCount).toBe(300)
    // cible = min(max(90, 150), 150) = 150 => coupe apres 2 paragraphes (200 >= 150)
    expect(out.extractWordCount).toBeLessThanOrEqual(200)
    // Jamais plus que 50% du contenu original
    expect(out.extractWordCount / out.originalWordCount).toBeLessThanOrEqual(0.67)
    expect(out.truncated).toBe(true)
  })

  it('article plus court que minWords : renvoye integralement, non tronque', () => {
    const html = paragraph(80)
    const out = truncateToExtract(html, 0.3, 150)

    expect(out.originalWordCount).toBe(80)
    expect(out.extractWordCount).toBe(80)
    expect(out.truncated).toBe(false)
    expect(out.html).toContain('mot0')
    expect(out.html).toContain('mot79')
  })

  it('structure top-level mixte (div, table, ul) : coupe respecte les blocs', () => {
    const html = [
      paragraph(100),
      `<table><tr><td>${Array.from({ length: 60 }, (_, i) => `cell${i}`).join(' ')}</td></tr></table>`,
      `<ul>${Array.from({ length: 80 }, (_, i) => `<li>item ${i}</li>`).join('')}</ul>`,
      paragraph(200),
    ].join('')
    const out = truncateToExtract(html, 0.3, 150)

    // Ni <table> ni <ul> ne sont coupes au milieu : on garde des blocs entiers
    const tableCount = out.html.match(/<table>/g)?.length ?? 0
    const tableCloseCount = out.html.match(/<\/table>/g)?.length ?? 0
    expect(tableCount).toBe(tableCloseCount)

    const ulOpen = out.html.match(/<ul>/g)?.length ?? 0
    const ulClose = out.html.match(/<\/ul>/g)?.length ?? 0
    expect(ulOpen).toBe(ulClose)

    expect(out.truncated).toBe(true)
  })

  it('wrapper unique <article> contenant des <p> imbriques : traite comme un seul top-level', () => {
    // Un seul noeud top-level <article>, contient 10 <p> de 100 mots separes
    // par des retours a la ligne (cas realiste du HTML serveur).
    const inner = Array.from({ length: 10 }, () => paragraph(100)).join('\n')
    const html = `<article>${inner}</article>`
    const out = truncateToExtract(html, 0.3, 150)

    // textContent sur un wrapper avec espaces inter-paragraphes : 1000 mots
    expect(out.originalWordCount).toBe(1000)
    // Un seul top-level : soit on le garde entier, soit rien. La cible 300 est
    // atteinte des le premier (et unique) noeud, donc article entier conserve.
    expect(out.extractWordCount).toBe(1000)
    expect(out.truncated).toBe(false)
    expect(out.html).toContain('<article>')
  })

  it('HTML vide ou blanc : ne plante pas', () => {
    expect(truncateToExtract('', 0.3, 150)).toEqual({
      html: '',
      extractWordCount: 0,
      originalWordCount: 0,
      truncated: false,
    })
    expect(truncateToExtract('   ', 0.3, 150).truncated).toBe(false)
  })

  it('ratio hors borne : clampe au plafond 0.5', () => {
    const html = Array.from({ length: 10 }, () => paragraph(100)).join('')
    const out = truncateToExtract(html, 0.9, 150)

    // 0.9 clampe a 0.5 => cible 500 mots
    expect(out.extractWordCount).toBeLessThanOrEqual(600)
    expect(out.extractWordCount).toBeGreaterThanOrEqual(500)
  })
})
