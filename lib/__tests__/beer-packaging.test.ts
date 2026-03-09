/**
 * Tests for lib/beer-packaging.ts
 *
 * Run directly (no test framework required):
 *   npx tsx lib/__tests__/beer-packaging.test.ts
 *
 * Or add to package.json:
 *   "test": "npx tsx lib/__tests__/beer-packaging.test.ts"
 */

import {
  detectPackageType,
  normalizeUnitType,
  parseQuantityString,
  extractPackagingFromName,
  computeEffectiveQuantity,
  formatPackBreakdown,
} from '../beer-packaging'

// ─── Minimal test runner ──────────────────────────────────────────────────────

let passed = 0
let failed = 0
let currentSuite = ''

function suite(name: string, fn: () => void) {
  currentSuite = name
  console.log(`\n${name}`)
  fn()
}

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  \x1b[32m✓\x1b[0m ${name}`)
    passed++
  } catch (err) {
    console.error(`  \x1b[31m✗\x1b[0m ${name}`)
    console.error(`    \x1b[31m${(err as Error).message}\x1b[0m`)
    failed++
  }
}

function eq<T>(actual: T, expected: T, msg?: string) {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) throw new Error(msg ?? `Expected ${b}\n    got     ${a}`)
}

// ─── detectPackageType ────────────────────────────────────────────────────────

suite('detectPackageType — searches within a text string', () => {
  // 6-pack
  test('6pk',                   () => eq(detectPackageType('6pk'),                   '6-pack'))
  test('6 pk',                  () => eq(detectPackageType('6 pk'),                  '6-pack'))
  test('6-pack',                () => eq(detectPackageType('6-pack'),                '6-pack'))
  test('6 pack',                () => eq(detectPackageType('6 pack'),                '6-pack'))
  test('six pack',              () => eq(detectPackageType('six pack'),              '6-pack'))
  test('six-pack',              () => eq(detectPackageType('six-pack'),              '6-pack'))
  test('embedded: "Corona 6pk"',() => eq(detectPackageType('Corona Extra 6pk'),     '6-pack'))

  // 12-pack
  test('12pk',                  () => eq(detectPackageType('12pk'),                  '12-pack'))
  test('12 pk',                 () => eq(detectPackageType('12 pk'),                 '12-pack'))
  test('12-pack',               () => eq(detectPackageType('12-pack'),               '12-pack'))
  test('12 pack',               () => eq(detectPackageType('12 pack'),               '12-pack'))
  test('twelve pack',           () => eq(detectPackageType('twelve pack'),           '12-pack'))
  test('embedded: "Modelo 12pk"',() => eq(detectPackageType('Modelo Especial 12pk'),'12-pack'))

  // 24-pack
  test('24pk',                  () => eq(detectPackageType('24pk'),                  '24-pack'))
  test('24 pk',                 () => eq(detectPackageType('24 pk'),                 '24-pack'))
  test('24-pack',               () => eq(detectPackageType('24-pack'),               '24-pack'))
  test('twenty four pack',      () => eq(detectPackageType('twenty four pack'),      '24-pack'))

  // 4-pack
  test('4pk',                   () => eq(detectPackageType('4pk'),                   '4-pack'))
  test('4-pack',                () => eq(detectPackageType('4-pack'),                '4-pack'))
  test('four pack',             () => eq(detectPackageType('four pack'),             '4-pack'))

  // Case
  test('case',                  () => eq(detectPackageType('case'),                  'case'))
  test('cs',                    () => eq(detectPackageType('cs'),                    'case'))
  test('24 ct',                 () => eq(detectPackageType('24 ct'),                 'case'))
  test('Bud Light case',        () => eq(detectPackageType('Bud Light case'),        'case'))

  // Keg
  test('keg',                   () => eq(detectPackageType('keg'),                   'keg'))
  test('full keg',              () => eq(detectPackageType('full keg'),              'keg'))
  test('half keg',              () => eq(detectPackageType('half keg'),              'keg'))
  test('barrel',                () => eq(detectPackageType('barrel'),                'keg'))
  test('1/2 bbl',               () => eq(detectPackageType('1/2 bbl'),              'keg'))

  // Single
  test('single',                () => eq(detectPackageType('single'),                'single'))
  test('bt',                    () => eq(detectPackageType('bt'),                    'single'))
  test('btl',                   () => eq(detectPackageType('btl'),                   'single'))
  test('bottle',                () => eq(detectPackageType('bottle'),                'single'))
  test('can',                   () => eq(detectPackageType('can'),                   'single'))
  test('ea',                    () => eq(detectPackageType('ea'),                    'single'))
  test('each',                  () => eq(detectPackageType('each'),                  'single'))

  // No match
  test('750ml — no match',      () => eq(detectPackageType('Patron Silver 750ml'),   null))
  test('plain name — no match', () => eq(detectPackageType('Heineken'),              null))
  test('"12oz" must not match 12-pack',() => eq(detectPackageType('Budweiser 12oz'), null))
  test('"24oz" must not match 24-pack',() => eq(detectPackageType('Miller Lite 24oz'),null))
})

// ─── normalizeUnitType ────────────────────────────────────────────────────────

suite('normalizeUnitType — exact unit string → canonical form', () => {
  // Case
  test('case',  () => eq(normalizeUnitType('case'),  { unit: 'case',   packageType: 'case',    unitsPerPackage: 24  }))
  test('cs',    () => eq(normalizeUnitType('cs'),    { unit: 'case',   packageType: 'case',    unitsPerPackage: 24  }))
  test('CS',    () => eq(normalizeUnitType('CS'),    { unit: 'case',   packageType: 'case',    unitsPerPackage: 24  }))
  test('cse',   () => eq(normalizeUnitType('cse'),   { unit: 'case',   packageType: 'case',    unitsPerPackage: 24  }))
  test('24 ct', () => eq(normalizeUnitType('24 ct'), { unit: 'case',   packageType: 'case',    unitsPerPackage: 24  }))

  // Keg
  test('keg',   () => eq(normalizeUnitType('keg'),   { unit: 'keg',    packageType: 'keg',     unitsPerPackage: 165 }))
  test('bbl',   () => eq(normalizeUnitType('bbl'),   { unit: 'keg',    packageType: 'keg',     unitsPerPackage: 165 }))

  // 24-pack
  test('24pk',  () => eq(normalizeUnitType('24pk'),  { unit: '24-pack',packageType: '24-pack', unitsPerPackage: 24  }))
  test('24 pk', () => eq(normalizeUnitType('24 pk'), { unit: '24-pack',packageType: '24-pack', unitsPerPackage: 24  }))
  test('24-pack',()=> eq(normalizeUnitType('24-pack'),{unit: '24-pack',packageType: '24-pack', unitsPerPackage: 24  }))
  test('24 pack',()=> eq(normalizeUnitType('24 pack'),{unit:'24-pack', packageType: '24-pack', unitsPerPackage: 24  }))

  // 12-pack
  test('12pk',  () => eq(normalizeUnitType('12pk'),  { unit: '12-pack',packageType: '12-pack', unitsPerPackage: 12  }))
  test('12 pk', () => eq(normalizeUnitType('12 pk'), { unit: '12-pack',packageType: '12-pack', unitsPerPackage: 12  }))
  test('12-pack',()=> eq(normalizeUnitType('12-pack'),{unit:'12-pack', packageType: '12-pack', unitsPerPackage: 12  }))
  test('12 pack',()=> eq(normalizeUnitType('12 pack'),{unit:'12-pack', packageType: '12-pack', unitsPerPackage: 12  }))

  // 6-pack
  test('6pk',   () => eq(normalizeUnitType('6pk'),   { unit: '6-pack', packageType: '6-pack',  unitsPerPackage: 6   }))
  test('6 pk',  () => eq(normalizeUnitType('6 pk'),  { unit: '6-pack', packageType: '6-pack',  unitsPerPackage: 6   }))
  test('6-pack',() => eq(normalizeUnitType('6-pack'),{ unit: '6-pack', packageType: '6-pack',  unitsPerPackage: 6   }))
  test('6 pack',() => eq(normalizeUnitType('6 pack'),{ unit: '6-pack', packageType: '6-pack',  unitsPerPackage: 6   }))
  test('six pack',()=>eq(normalizeUnitType('six pack'),{unit:'6-pack', packageType: '6-pack',  unitsPerPackage: 6   }))

  // 4-pack
  test('4pk',   () => eq(normalizeUnitType('4pk'),   { unit: '4-pack', packageType: '4-pack',  unitsPerPackage: 4   }))
  test('4-pack',() => eq(normalizeUnitType('4-pack'),{ unit: '4-pack', packageType: '4-pack',  unitsPerPackage: 4   }))

  // Singles
  test('bt',    () => eq(normalizeUnitType('bt'),    { unit: 'bottle', packageType: 'single',  unitsPerPackage: 1   }))
  test('btl',   () => eq(normalizeUnitType('btl'),   { unit: 'bottle', packageType: 'single',  unitsPerPackage: 1   }))
  test('bottle',() => eq(normalizeUnitType('bottle'),{ unit: 'bottle', packageType: 'single',  unitsPerPackage: 1   }))
  test('can',   () => eq(normalizeUnitType('can'),   { unit: 'bottle', packageType: 'single',  unitsPerPackage: 1   }))
  test('ea',    () => eq(normalizeUnitType('ea'),    { unit: 'bottle', packageType: 'single',  unitsPerPackage: 1   }))
  test('each',  () => eq(normalizeUnitType('each'),  { unit: 'bottle', packageType: 'single',  unitsPerPackage: 1   }))
  test('single',() => eq(normalizeUnitType('single'),{ unit: 'bottle', packageType: 'single',  unitsPerPackage: 1   }))

  // Ambiguous "pk"/"pack" — size unknown
  test('"pk" alone — no size known',   () => eq(normalizeUnitType('pk').packageType,   null))
  test('"pack" alone — no size known', () => eq(normalizeUnitType('pack').packageType, null))

  // Volume units pass through untouched
  test('oz pass-through',  () => eq(normalizeUnitType('oz'),  { unit: 'oz',  packageType: null, unitsPerPackage: null }))
  test('ml pass-through',  () => eq(normalizeUnitType('ml'),  { unit: 'ml',  packageType: null, unitsPerPackage: null }))
  test('l pass-through',   () => eq(normalizeUnitType('l'),   { unit: 'l',   packageType: null, unitsPerPackage: null }))
  test('pint pass-through',() => eq(normalizeUnitType('pint'),{ unit: 'pint',packageType: null, unitsPerPackage: null }))
})

// ─── parseQuantityString ──────────────────────────────────────────────────────

suite('parseQuantityString — combined "quantity [unit]" cells', () => {
  // Pure numbers
  test('integer',        () => eq(parseQuantityString('12'),    { quantity: 12,   packageType: null,     unitsPerPackage: null }))
  test('decimal',        () => eq(parseQuantityString('2.5'),   { quantity: 2.5,  packageType: null,     unitsPerPackage: null }))
  test('with commas',    () => eq(parseQuantityString('1,234'), { quantity: 1234, packageType: null,     unitsPerPackage: null }))

  // Number + unit (space)
  test('2 cs',           () => eq(parseQuantityString('2 cs'),      { quantity: 2, packageType: 'case',    unitsPerPackage: 24  }))
  test('2 case',         () => eq(parseQuantityString('2 case'),     { quantity: 2, packageType: 'case',    unitsPerPackage: 24  }))
  test('6 bt',           () => eq(parseQuantityString('6 bt'),       { quantity: 6, packageType: 'single',  unitsPerPackage: 1   }))
  test('6 bottle',       () => eq(parseQuantityString('6 bottle'),   { quantity: 6, packageType: 'single',  unitsPerPackage: 1   }))
  test('3 keg',          () => eq(parseQuantityString('3 keg'),      { quantity: 3, packageType: 'keg',     unitsPerPackage: 165 }))
  test('1 6-pack',       () => eq(parseQuantityString('1 6-pack'),   { quantity: 1, packageType: '6-pack',  unitsPerPackage: 6   }))
  test('2 12-pack',      () => eq(parseQuantityString('2 12-pack'),  { quantity: 2, packageType: '12-pack', unitsPerPackage: 12  }))
  test('2 24pk',         () => eq(parseQuantityString('2 24pk'),     { quantity: 2, packageType: '24-pack', unitsPerPackage: 24  }))
  test('2 24 pk',        () => eq(parseQuantityString('2 24 pk'),    { quantity: 2, packageType: '24-pack', unitsPerPackage: 24  }))
  test('4 6pk',          () => eq(parseQuantityString('4 6pk'),      { quantity: 4, packageType: '6-pack',  unitsPerPackage: 6   }))

  // Number + unit (no space)
  test('2cs (no space)', () => eq(parseQuantityString('2cs'),        { quantity: 2, packageType: 'case',    unitsPerPackage: 24  }))
  test('6bt (no space)', () => eq(parseQuantityString('6bt'),        { quantity: 6, packageType: 'single',  unitsPerPackage: 1   }))

  // "6pk" alone in qty field — qty=6, size unknown (not a unit-type context)
  test('"6pk" alone — qty=6, type=null (bare pk has no known size)', () => {
    const r = parseQuantityString('6pk')
    eq(r.quantity, 6)
    // "pk" alone → no package type (we'd need normalizeUnitType("6pk") which DOES return 6-pack...)
    // Actually: "6pk" splits to number="6", unit="pk" → normalizeUnitType("pk") → null
    eq(r.packageType, null)
  })

  // Edge cases
  test('empty string',  () => eq(parseQuantityString(''),    { quantity: null, packageType: null, unitsPerPackage: null }))
  test('non-numeric',   () => eq(parseQuantityString('abc'), { quantity: null, packageType: null, unitsPerPackage: null }))
  test('leading spaces',() => eq(parseQuantityString('  3 cs  ').quantity, 3))
})

// ─── extractPackagingFromName ─────────────────────────────────────────────────

suite('extractPackagingFromName — strips pack suffix from product names', () => {
  // 24-pack
  test('Corona Extra 24pk', () => eq(
    extractPackagingFromName('Corona Extra 24pk'),
    { cleanName: 'Corona Extra', packageType: '24-pack', unitsPerPackage: 24 }
  ))
  test('Bud Light 24 Pack', () => eq(
    extractPackagingFromName('Bud Light 24 Pack'),
    { cleanName: 'Bud Light', packageType: '24-pack', unitsPerPackage: 24 }
  ))
  test('Coors 24-pack', () => eq(
    extractPackagingFromName('Coors 24-pack'),
    { cleanName: 'Coors', packageType: '24-pack', unitsPerPackage: 24 }
  ))

  // 12-pack
  test('Modelo Especial 12pk', () => eq(
    extractPackagingFromName('Modelo Especial 12pk'),
    { cleanName: 'Modelo Especial', packageType: '12-pack', unitsPerPackage: 12 }
  ))
  test('Stella Artois 12 Pack', () => eq(
    extractPackagingFromName('Stella Artois 12 Pack'),
    { cleanName: 'Stella Artois', packageType: '12-pack', unitsPerPackage: 12 }
  ))
  test('Heineken 12-pack', () => eq(
    extractPackagingFromName('Heineken 12-pack'),
    { cleanName: 'Heineken', packageType: '12-pack', unitsPerPackage: 12 }
  ))
  test('Heineken Twelve Pack', () => eq(
    extractPackagingFromName('Heineken Twelve Pack'),
    { cleanName: 'Heineken', packageType: '12-pack', unitsPerPackage: 12 }
  ))

  // 6-pack
  test('Sam Adams 6pk', () => eq(
    extractPackagingFromName('Sam Adams 6pk'),
    { cleanName: 'Sam Adams', packageType: '6-pack', unitsPerPackage: 6 }
  ))
  test('Blue Moon 6-pack', () => eq(
    extractPackagingFromName('Blue Moon 6-pack'),
    { cleanName: 'Blue Moon', packageType: '6-pack', unitsPerPackage: 6 }
  ))
  test('Guinness 6 Pack', () => eq(
    extractPackagingFromName('Guinness 6 Pack'),
    { cleanName: 'Guinness', packageType: '6-pack', unitsPerPackage: 6 }
  ))
  test('Dos Equis Six Pack', () => eq(
    extractPackagingFromName('Dos Equis Six Pack'),
    { cleanName: 'Dos Equis', packageType: '6-pack', unitsPerPackage: 6 }
  ))

  // 4-pack
  test('Goose Island 4pk', () => eq(
    extractPackagingFromName('Goose Island 4pk'),
    { cleanName: 'Goose Island', packageType: '4-pack', unitsPerPackage: 4 }
  ))

  // Case
  test('Modelo Case', () => eq(
    extractPackagingFromName('Modelo Case'),
    { cleanName: 'Modelo', packageType: 'case', unitsPerPackage: 24 }
  ))
  test('Bud Light CS', () => eq(
    extractPackagingFromName('Bud Light CS'),
    { cleanName: 'Bud Light', packageType: 'case', unitsPerPackage: 24 }
  ))

  // Keg
  test('Budweiser Keg', () => eq(
    extractPackagingFromName('Budweiser Keg'),
    { cleanName: 'Budweiser', packageType: 'keg', unitsPerPackage: 165 }
  ))

  // Single
  test('Budweiser Btl', () => eq(
    extractPackagingFromName('Budweiser Btl'),
    { cleanName: 'Budweiser', packageType: 'single', unitsPerPackage: 1 }
  ))
  test('Corona Bt', () => eq(
    extractPackagingFromName('Corona Bt'),
    { cleanName: 'Corona', packageType: 'single', unitsPerPackage: 1 }
  ))
  test('Topo Chico Can', () => eq(
    extractPackagingFromName('Topo Chico Can'),
    { cleanName: 'Topo Chico', packageType: 'single', unitsPerPackage: 1 }
  ))

  // No pack info — names untouched
  test('Patron Silver 750ml — no match', () => eq(
    extractPackagingFromName('Patron Silver 750ml'),
    { cleanName: 'Patron Silver 750ml', packageType: null, unitsPerPackage: null }
  ))
  test('Tito\'s Vodka — no match', () => eq(
    extractPackagingFromName("Tito's Vodka"),
    { cleanName: "Tito's Vodka", packageType: null, unitsPerPackage: null }
  ))
  test('Heineken — no match', () => eq(
    extractPackagingFromName('Heineken'),
    { cleanName: 'Heineken', packageType: null, unitsPerPackage: null }
  ))
  test('"Budweiser 12oz" — 12oz is volume, not 12-pack', () => eq(
    extractPackagingFromName('Budweiser 12oz'),
    { cleanName: 'Budweiser 12oz', packageType: null, unitsPerPackage: null }
  ))
})

// ─── computeEffectiveQuantity ─────────────────────────────────────────────────

suite('computeEffectiveQuantity — packs × units_per_pack', () => {
  test('2 cases  × 24 = 48', () => eq(computeEffectiveQuantity(2, 24),  48))
  test('3 6-packs × 6 = 18', () => eq(computeEffectiveQuantity(3, 6),   18))
  test('1 12-pack × 12= 12', () => eq(computeEffectiveQuantity(1, 12),  12))
  test('5 singles × 1 =  5', () => eq(computeEffectiveQuantity(5, 1),    5))
  test('5 bottles, null = 5', () => eq(computeEffectiveQuantity(5, null), 5))
  test('0 packs   × 24 =  0', () => eq(computeEffectiveQuantity(0, 24),   0))
  test('2.5 × 24 = 60',       () => eq(computeEffectiveQuantity(2.5, 24), 60))
})

// ─── formatPackBreakdown ──────────────────────────────────────────────────────

suite('formatPackBreakdown — display string', () => {
  test('48 units, 24-pack',   () => eq(formatPackBreakdown(48, 24, '24-pack'),  '48 units · 2 × 24-pack'))
  test('18 units, 6-pack',    () => eq(formatPackBreakdown(18, 6,  '6-pack'),   '18 units · 3 × 6-pack'))
  test('7 units, 6-pack+rem', () => eq(formatPackBreakdown(7,  6,  '6-pack'),   '7 units · 1 × 6-pack + 1'))
  test('3 singles (packSize=1)',()=> eq(formatPackBreakdown(3,  1,  null),       '3 units'))
  test('1 unit',               () => eq(formatPackBreakdown(1,  1,  null),       '1 unit'))
  test('no package label',     () => eq(formatPackBreakdown(12, 6,  null),       '12 units · 2 × 6-pack'))
})

// ─── Integration smoke tests ──────────────────────────────────────────────────

suite('Integration: full purchase-CSV row parsing flow', () => {
  test('qty="2 cs" → 48 individual units', () => {
    const { quantity, unitsPerPackage } = parseQuantityString('2 cs')
    eq(computeEffectiveQuantity(quantity!, unitsPerPackage), 48)
  })

  test('qty="6 bt" → 6 individual units', () => {
    const { quantity, unitsPerPackage } = parseQuantityString('6 bt')
    eq(computeEffectiveQuantity(quantity!, unitsPerPackage), 6)
  })

  test('qty="3 keg" → 495 individual units', () => {
    const { quantity, unitsPerPackage } = parseQuantityString('3 keg')
    eq(computeEffectiveQuantity(quantity!, unitsPerPackage), 495)
  })

  test('qty="2 24pk" → 48 individual units', () => {
    const { quantity, unitsPerPackage } = parseQuantityString('2 24pk')
    eq(computeEffectiveQuantity(quantity!, unitsPerPackage), 48)
  })

  test('name="Bud Light 12pk", qty=2 → cleanName="Bud Light", 24 individual units', () => {
    const { cleanName, packageType, unitsPerPackage } = extractPackagingFromName('Bud Light 12pk')
    eq(cleanName, 'Bud Light')
    eq(packageType, '12-pack')
    eq(computeEffectiveQuantity(2, unitsPerPackage), 24)
  })

  test('unit_type="cs" + qty=3 → case, 72 units', () => {
    const { packageType, unitsPerPackage } = normalizeUnitType('cs')
    eq(packageType, 'case')
    eq(computeEffectiveQuantity(3, unitsPerPackage), 72)
  })
})

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`)
if (failed === 0) {
  console.log(`\x1b[32m✓ All ${passed} tests passed\x1b[0m\n`)
} else {
  console.log(`\x1b[31m${failed} failed\x1b[0m, ${passed} passed\n`)
  process.exit(1)
}
