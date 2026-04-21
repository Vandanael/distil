import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

async function main() {
  const ROOT = join(process.cwd(), 'public')
  const OUT = join(ROOT, 'icons')

  mkdirSync(OUT, { recursive: true })

  const iconSvg = readFileSync(join(ROOT, 'icon.svg'))
  const maskableSvg = readFileSync(join(ROOT, 'icon-maskable.svg'))

  const jobs = [
    { src: iconSvg, name: 'icon-192.png', size: 192 },
    { src: iconSvg, name: 'icon-512.png', size: 512 },
    { src: maskableSvg, name: 'icon-512-maskable.png', size: 512 },
    { src: maskableSvg, name: 'apple-touch-icon.png', size: 180 },
    { src: iconSvg, name: 'favicon-32.png', size: 32 },
    { src: iconSvg, name: 'favicon-16.png', size: 16 },
  ]

  for (const { src, name, size } of jobs) {
    await sharp(src).resize(size, size).png().toFile(join(OUT, name))
    console.log(`Generated ${name}`)
  }
}

void main()
