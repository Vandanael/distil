import { ImageResponse } from 'next/og'

export const alt = 'Distil - Veille intelligente'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '80px',
        backgroundColor: '#f7f8f3',
        position: 'relative',
      }}
    >
      {/* Ligne accent en haut */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          backgroundColor: '#7A2E3A',
        }}
      />

      {/* Contenu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Filet orange */}
        <div style={{ width: '64px', height: '3px', backgroundColor: '#7A2E3A' }} />

        {/* Logo */}
        <div
          style={{
            fontSize: '112px',
            fontWeight: 700,
            color: '#1a3a2e',
            lineHeight: 1,
            letterSpacing: '-4px',
            textTransform: 'uppercase',
            fontFamily: 'Georgia, serif',
          }}
        >
          Distil
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: '#587060',
            lineHeight: 1.4,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
          }}
        >
          Votre veille quotidienne, sans le bruit.
        </div>
      </div>
    </div>,
    size
  )
}
