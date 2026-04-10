// ─── Types ────────────────────────────────────────────────────────────────────

export type PackageType = 'single' | '4-pack' | '6-pack' | '12-pack' | '24-pack' | 'case' | 'keg'

export const PACKAGE_TYPE_OPTIONS: PackageType[] = [
  'single', '4-pack', '6-pack', '12-pack', '24-pack', 'case', 'keg',
]

/**
 * Default number of individual SELLABLE SERVINGS per package type.
 * These are not oz — they are the count of cans/bottles/pints inside each package.
 *
 * keg = 165 pints (15.5 gal half-barrel ÷ 16oz per pint)
 *
 * For oz-based conversion factors, see UNIT_TO_OZ in lib/conversions.ts.
 * Do NOT mix these two tables — they measure different things.
 */
export const PACKAGE_TYPE_SIZES: Record<PackageType, number> = {
  'single':   1,
  '4-pack':   4,
  '6-pack':   6,
  '12-pack':  12,
  '24-pack':  24,
  'case':     24,  // 24 × 12oz cans/bottles
  'keg':      165, // 165 pints per half-barrel keg
}

/**
 * Sellable pint counts for keg sub-variants that are not in PackageType
 * (they're size variants of 'keg', not separate top-level types).
 *
 * Quarter keg (Pony keg): 7.75 gal = 992 oz ÷ 16 oz/pint = 62 pints
 * Sixth keg (Sixtel):     5.16 gal = 660 oz ÷ 16 oz/pint ≈ 41 pints
 */
export const QUARTER_KEG_PINTS = 62
export const SIXTH_KEG_PINTS   = 41

// ─── Return types ─────────────────────────────────────────────────────────────

export interface NormalizedUnit {
  /** Canonical unit label to store or display */
  unit: string
  packageType: PackageType | null
  /** Individual unit count per package, null if not a multi-unit pack */
  unitsPerPackage: number | null
}

export interface ParsedQuantity {
  /** Numeric quantity value, null if the raw string was unparseable */
  quantity: number | null
  packageType: PackageType | null
  /** Individual units per package if packaging was detected in the string */
  unitsPerPackage: number | null
}

// ─── Internal pattern tables ──────────────────────────────────────────────────

/**
 * Used by detectPackageType() and extractPackagingFromName().
 * Order matters: more specific patterns (24-pack) before catch-alls (case).
 */
const PACK_PATTERNS: Array<{ pattern: RegExp; type: PackageType }> = [
  // Kegs — most specific first
  {
    pattern: /\b(keg|full[\s-]?keg|half[\s-]?keg|1\/2[\s-]?bbl|1\/4[\s-]?bbl|1\/6[\s-]?bbl|barrel)\b/i,
    type: 'keg',
  },
  // Cases / 24-count formats that aren't size-qualified packs
  {
    pattern: /\b(case|cs|cse|24[\s-]?ct|24[\s-]?count)\b/i,
    type: 'case',
  },
  // Size-qualified packs — longest number first to avoid partial matches
  {
    pattern: /\b(24[\s-]?pk|24[\s-]?pack|24-pack|twenty[\s-]?four[\s-]?pack)\b/i,
    type: '24-pack',
  },
  {
    pattern: /\b(12[\s-]?pk|12[\s-]?pack|12-pack|twelve[\s-]?pack)\b/i,
    type: '12-pack',
  },
  {
    pattern: /\b(6[\s-]?pk|6[\s-]?pack|6-pack|six[\s-]?pack)\b/i,
    type: '6-pack',
  },
  {
    pattern: /\b(4[\s-]?pk|4[\s-]?pack|4-pack|four[\s-]?pack)\b/i,
    type: '4-pack',
  },
  // Singles — bottle/can/each
  {
    pattern: /\b(single|singles|bt|btl|btls|bottle|bottles|can|cans|ea|each)\b/i,
    type: 'single',
  },
]

// ─── Core detection ───────────────────────────────────────────────────────────

/**
 * Scan any text for a pack-type keyword (e.g. in a product name or description).
 * Returns the first matching PackageType, or null if none found.
 *
 * Examples:
 *   detectPackageType("Corona Extra 24pk")  → "24-pack"
 *   detectPackageType("Heineken 6 pack")     → "6-pack"
 *   detectPackageType("Patron Silver 750ml") → null
 */
export function detectPackageType(text: string): PackageType | null {
  for (const { pattern, type } of PACK_PATTERNS) {
    if (pattern.test(text)) return type
  }
  return null
}

// ─── Unit type normalization ──────────────────────────────────────────────────

/**
 * Normalize a raw unit-type string (as found in a CSV unit column or API response)
 * into a canonical unit label + packaging metadata.
 *
 * Handles exact tokens and common abbreviations. Volume/weight units (oz, ml, l)
 * pass through unchanged with null packaging.
 *
 * Examples:
 *   normalizeUnitType("cs")       → { unit: "case",   packageType: "case",    unitsPerPackage: 24 }
 *   normalizeUnitType("6pk")      → { unit: "6-pack", packageType: "6-pack",  unitsPerPackage: 6  }
 *   normalizeUnitType("6 pk")     → { unit: "6-pack", packageType: "6-pack",  unitsPerPackage: 6  }
 *   normalizeUnitType("bt")       → { unit: "bottle", packageType: "single",  unitsPerPackage: 1  }
 *   normalizeUnitType("keg")      → { unit: "keg",    packageType: "keg",     unitsPerPackage: 165 }
 *   normalizeUnitType("oz")       → { unit: "oz",     packageType: null,      unitsPerPackage: null }
 *   normalizeUnitType("pk")       → { unit: "pk",     packageType: null,      unitsPerPackage: null }
 */
export function normalizeUnitType(raw: string): NormalizedUnit {
  const s = raw.trim().toLowerCase()

  // — Kegs —
  if (/^(keg|kegs|full[\s-]?keg|half[\s-]?keg|1\/2[\s-]?bbl|1\/4[\s-]?bbl|1\/6[\s-]?bbl|barrel|bbl)$/.test(s))
    return { unit: 'keg', packageType: 'keg', unitsPerPackage: PACKAGE_TYPE_SIZES.keg }

  // — Case / 24-count (not a size-qualified pack) —
  if (/^(case|cases|cs|cse|24\s*ct|24\s*count|24-count)$/.test(s))
    return { unit: 'case', packageType: 'case', unitsPerPackage: PACKAGE_TYPE_SIZES.case }

  // — Size-qualified packs — most specific (24) first —
  if (/^(24[\s-]?pk|24[\s-]?pack|24-pack)$/.test(s))
    return { unit: '24-pack', packageType: '24-pack', unitsPerPackage: 24 }

  if (/^(12[\s-]?pk|12[\s-]?pack|12-pack|twelve[\s-]?pack)$/.test(s))
    return { unit: '12-pack', packageType: '12-pack', unitsPerPackage: 12 }

  if (/^(6[\s-]?pk|6[\s-]?pack|6-pack|six[\s-]?pack)$/.test(s))
    return { unit: '6-pack', packageType: '6-pack', unitsPerPackage: 6 }

  if (/^(4[\s-]?pk|4[\s-]?pack|4-pack|four[\s-]?pack)$/.test(s))
    return { unit: '4-pack', packageType: '4-pack', unitsPerPackage: 4 }

  // — Singles —
  if (/^(single|singles|bt|btl|btls|bottle|bottles|can|cans|ea|each|unit|units)$/.test(s))
    return { unit: 'bottle', packageType: 'single', unitsPerPackage: 1 }

  // — Bare "pk"/"pack" without a size — we know it's a pack but not which size —
  if (/^(pk|pack|packs)$/.test(s))
    return { unit: 'pack', packageType: null, unitsPerPackage: null }

  // — Volume strings → canonical bottle units —
  if (/^(750\s*ml|750ml)$/i.test(s))
    return { unit: 'bottle', packageType: 'single', unitsPerPackage: 1 }

  if (/^(wine\s*bottle|wine\s*btl|wine\s*bot|wine\s*b\/t)$/i.test(s))
    return { unit: 'wine_bottle', packageType: 'single', unitsPerPackage: 1 }

  if (/^(1000\s*ml|1000ml|1\s*l|1l|1\s*liter|1\s*litre)$/i.test(s))
    return { unit: '1L', packageType: null, unitsPerPackage: null }

  if (/^(1750\s*ml|1750ml|1\.75\s*l|1\.75l|1\.75\s*liter|1\.75\s*litre|handle)$/i.test(s))
    return { unit: '1.75L', packageType: null, unitsPerPackage: null }

  // — Volume / weight / other — pass through unchanged —
  return { unit: raw.trim(), packageType: null, unitsPerPackage: null }
}

// ─── Quantity string parsing ──────────────────────────────────────────────────

/**
 * Parse a raw quantity cell that may contain a combined number + unit string.
 * Returns the numeric quantity and, if a packaging unit was present, its type.
 *
 * Does NOT compute effective (individual) units — call computeEffectiveQuantity()
 * on the result if you need to convert packs → individual units.
 *
 * Examples:
 *   parseQuantityString("12")       → { quantity: 12,  packageType: null,     unitsPerPackage: null }
 *   parseQuantityString("2.5")      → { quantity: 2.5, packageType: null,     unitsPerPackage: null }
 *   parseQuantityString("2 cs")     → { quantity: 2,   packageType: "case",   unitsPerPackage: 24   }
 *   parseQuantityString("2 case")   → { quantity: 2,   packageType: "case",   unitsPerPackage: 24   }
 *   parseQuantityString("6 bt")     → { quantity: 6,   packageType: "single", unitsPerPackage: 1    }
 *   parseQuantityString("3 keg")    → { quantity: 3,   packageType: "keg",    unitsPerPackage: 165  }
 *   parseQuantityString("2 6pk")    → { quantity: 2,   packageType: "6-pack", unitsPerPackage: 6    }
 *   parseQuantityString("1 24-pack")→ { quantity: 1,   packageType: "24-pack",unitsPerPackage: 24   }
 *   parseQuantityString("6pk")      → { quantity: 6,   packageType: null,     unitsPerPackage: null }
 *   parseQuantityString("2,345")    → { quantity: 2345,packageType: null,     unitsPerPackage: null }
 *   parseQuantityString("abc")      → { quantity: null, packageType: null,    unitsPerPackage: null }
 */
export function parseQuantityString(raw: string): ParsedQuantity {
  const s = raw.trim().replace(/,/g, '') // strip thousand-separator commas
  if (!s) return { quantity: null, packageType: null, unitsPerPackage: null }

  // Split into leading number + optional trailing unit
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
  if (!match) return { quantity: null, packageType: null, unitsPerPackage: null }

  const qty = parseFloat(match[1])
  const unitRaw = match[2].trim()

  if (!unitRaw) return { quantity: qty, packageType: null, unitsPerPackage: null }

  const { packageType, unitsPerPackage } = normalizeUnitType(unitRaw)
  return { quantity: qty, packageType, unitsPerPackage }
}

// ─── Name packaging extraction ────────────────────────────────────────────────

/**
 * Detect and strip packaging info from the end of a product name.
 * Only strips suffixes that are clearly packaging tokens; volume measurements
 * (750ml, 12oz, 1L) are left untouched.
 *
 * Examples:
 *   extractPackagingFromName("Corona Extra 24pk")    → { cleanName: "Corona Extra",    packageType: "24-pack", unitsPerPackage: 24  }
 *   extractPackagingFromName("Bud Light 12 Pack")    → { cleanName: "Bud Light",       packageType: "12-pack", unitsPerPackage: 12  }
 *   extractPackagingFromName("Modelo Especial Case") → { cleanName: "Modelo Especial", packageType: "case",    unitsPerPackage: 24  }
 *   extractPackagingFromName("Heineken 6-pack")      → { cleanName: "Heineken",        packageType: "6-pack",  unitsPerPackage: 6   }
 *   extractPackagingFromName("Coors Light 4pk")      → { cleanName: "Coors Light",     packageType: "4-pack",  unitsPerPackage: 4   }
 *   extractPackagingFromName("Budweiser Btl")        → { cleanName: "Budweiser",       packageType: "single",  unitsPerPackage: 1   }
 *   extractPackagingFromName("Patron Silver 750ml")  → { cleanName: "Patron Silver 750ml", packageType: null, unitsPerPackage: null }
 *   extractPackagingFromName("Heineken")             → { cleanName: "Heineken",        packageType: null,      unitsPerPackage: null }
 */
export function extractPackagingFromName(
  name: string,
): { cleanName: string; packageType: PackageType | null; unitsPerPackage: number | null } {
  // Patterns that are valid at the end of a product name.
  // Ordered most-specific first (24pk before case, etc.)
  const SUFFIX_PATTERNS: Array<{ pattern: RegExp; type: PackageType }> = [
    {
      pattern: /[\s,]+(keg|full[\s-]?keg|half[\s-]?keg|1\/2[\s-]?bbl|barrel)\s*$/i,
      type: 'keg',
    },
    {
      pattern: /[\s,]+(24[\s-]?pk|24[\s-]?pack|24-pack)\s*$/i,
      type: '24-pack',
    },
    {
      pattern: /[\s,]+(12[\s-]?pk|12[\s-]?pack|12-pack|twelve[\s-]?pack)\s*$/i,
      type: '12-pack',
    },
    {
      pattern: /[\s,]+(6[\s-]?pk|6[\s-]?pack|6-pack|six[\s-]?pack)\s*$/i,
      type: '6-pack',
    },
    {
      pattern: /[\s,]+(4[\s-]?pk|4[\s-]?pack|4-pack|four[\s-]?pack)\s*$/i,
      type: '4-pack',
    },
    {
      pattern: /[\s,]+(case|cases|cs|24[\s-]?ct)\s*$/i,
      type: 'case',
    },
    {
      pattern: /[\s,]+(single|singles|bt|btl|btls|bottle|bottles|can|cans|ea|each)\s*$/i,
      type: 'single',
    },
  ]

  for (const { pattern, type } of SUFFIX_PATTERNS) {
    if (pattern.test(name)) {
      const cleanName = name.replace(pattern, '').trim()
      return { cleanName, packageType: type, unitsPerPackage: PACKAGE_TYPE_SIZES[type] }
    }
  }

  return { cleanName: name, packageType: null, unitsPerPackage: null }
}

// ─── Quantity math ────────────────────────────────────────────────────────────

/**
 * Convert a pack-level quantity to individual units.
 * If unitsPerPackage is null or ≤ 1, returns qty unchanged.
 *
 * Examples:
 *   computeEffectiveQuantity(2, 24)  → 48
 *   computeEffectiveQuantity(3, 6)   → 18
 *   computeEffectiveQuantity(5, 1)   → 5
 *   computeEffectiveQuantity(5, null)→ 5
 */
export function computeEffectiveQuantity(qty: number, unitsPerPackage: number | null): number {
  if (!unitsPerPackage || unitsPerPackage <= 1) return qty
  return qty * unitsPerPackage
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/**
 * Format a quantity as "N units · X × pack-label".
 * If packSize ≤ 1, returns just the unit count.
 *
 * Examples:
 *   formatPackBreakdown(48, 24, "24-pack") → "48 units · 2 × 24-pack"
 *   formatPackBreakdown(7,  6,  "6-pack")  → "7 units · 1 × 6-pack + 1"
 *   formatPackBreakdown(3,  1,  null)      → "3 units"
 */
export function formatPackBreakdown(
  totalUnits: number,
  packSize: number,
  packageType?: string | null,
): string {
  const units = Math.round(totalUnits * 100) / 100
  if (packSize <= 1) return `${units} unit${units !== 1 ? 's' : ''}`
  const packs  = Math.floor(units / packSize)
  const rem    = Math.round((units % packSize) * 100) / 100
  const label  = packageType ?? `${packSize}-pack`
  // Don't show "0 × case + N" — just show the remainder as loose units
  if (packs === 0) return `${totalUnits} units · ${rem} loose`
  const packStr = `${packs} × ${label}${rem > 0 ? ` + ${rem} loose` : ''}`
  return `${totalUnits} units · ${packStr}`
}
