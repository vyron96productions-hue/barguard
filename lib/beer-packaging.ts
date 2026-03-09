export type PackageType = 'single' | '4-pack' | '6-pack' | '12-pack' | '24-pack' | 'case' | 'keg'

export const PACKAGE_TYPE_OPTIONS: PackageType[] = [
  'single', '4-pack', '6-pack', '12-pack', '24-pack', 'case', 'keg',
]

/** Default unit count per package type */
export const PACKAGE_TYPE_SIZES: Record<PackageType, number> = {
  'single':   1,
  '4-pack':   4,
  '6-pack':   6,
  '12-pack':  12,
  '24-pack':  24,
  'case':     24,
  'keg':      165,
}

const PACK_PATTERNS: Array<{ pattern: RegExp; type: PackageType }> = [
  { pattern: /\b(keg|full[\s-]?keg|half[\s-]?keg|barrel)\b/i,                                        type: 'keg'     },
  { pattern: /\b(case|cs|24[\s-]?pk|24[\s-]?pack|24-pack|twenty[\s-]?four[\s-]?pack)\b/i,            type: 'case'    },
  { pattern: /\b(12[\s-]?pk|12[\s-]?pack|12-pack|twelve[\s-]?pack)\b/i,                              type: '12-pack' },
  { pattern: /\b(6[\s-]?pk|6[\s-]?pack|6-pack|six[\s-]?pack)\b/i,                                    type: '6-pack'  },
  { pattern: /\b(4[\s-]?pk|4[\s-]?pack|4-pack|four[\s-]?pack)\b/i,                                   type: '4-pack'  },
  { pattern: /\b(single|bt\b|btl\b|bottle\b|can\b|ea\b|each\b)\b/i,                                  type: 'single'  },
]

/** Detect a PackageType from any product name / description string. */
export function detectPackageType(text: string): PackageType | null {
  for (const { pattern, type } of PACK_PATTERNS) {
    if (pattern.test(text)) return type
  }
  return null
}

/** Returns a human-readable breakdown string, e.g. "48 units · 2 × 24-pack" */
export function formatPackBreakdown(
  totalUnits: number,
  packSize: number,
  packageType?: string | null,
): string {
  if (packSize <= 1) return `${totalUnits} unit${totalUnits !== 1 ? 's' : ''}`
  const packs = Math.floor(totalUnits / packSize)
  const rem   = totalUnits % packSize
  const label = packageType ?? `${packSize}-pack`
  const packStr = `${packs} × ${label}${rem > 0 ? ` + ${rem}` : ''}`
  return `${totalUnits} units · ${packStr}`
}
