export function getLevelColor(level: number, fallback: string): string {
  'worklet'
  // Normalize to avoid float precision mismatches (lightweight/TV style).
  // E.g. 0.2360000001 -> 0.236
  const normalized = Number.isFinite(level)
    ? Math.round(level * 1000) / 1000
    : Number.NaN

  if (!Number.isFinite(normalized)) return fallback

  if (normalized === 0) return 'rgb(127, 121, 125)'
  if (normalized === 0.236) return 'rgb(202, 98, 71)'
  if (normalized === 0.382) return 'rgb(148, 184, 156)'
  if (normalized === 0.5) return 'rgb(106, 158, 120)'
  if (normalized === 0.618) return 'rgb(56, 127, 119)'
  if (normalized === 0.786) return 'rgb(139, 173, 200)'
  if (normalized === 1) return 'rgb(118, 124, 138)'
  if (normalized === 1.272) return '#FF1493'
  if (normalized === 1.618) return '#FF1493'
  if (normalized === 2.618) return '#8A2BE2'
  if (normalized === 3.618) return '#FF4500'
  if (normalized === 4.236) return '#FFD700'

  return fallback
}

export function formatCompactUsd(value: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '$0.00'

  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  const trimZeros = (s: string) =>
    s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
  const formatFixed = (n: number, decimals: number) =>
    `${sign}$${trimZeros(n.toFixed(decimals))}`
  const format = (n: number, suffix: string) =>
    `${sign}$${trimZeros(n.toFixed(2))}${suffix}`

  if (abs >= 1e12) return format(abs / 1e12, 'T')
  if (abs >= 1e9) return format(abs / 1e9, 'B')
  if (abs >= 1e6) return format(abs / 1e6, 'M')
  if (abs >= 1e3) return format(abs / 1e3, 'K')

  // For sub-$1 prices, keep enough precision for tiny values.
  if (abs >= 1) return formatFixed(abs, 2)
  if (abs >= 0.01) return formatFixed(abs, 4)
  if (abs >= 0.000001) return formatFixed(abs, 8)
  return formatFixed(abs, 10)
}
