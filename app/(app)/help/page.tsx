'use client'

import { useState } from 'react'

interface Section {
  id: string
  icon: string
  title: string
  subtitle: string
  content: React.ReactNode
}

function AccordionSection({
  section,
  open,
  onToggle,
}: {
  section: Section
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 bg-slate-900 hover:bg-slate-800/80 transition-colors text-left"
      >
        <span className="text-2xl shrink-0">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 text-base">{section.title}</p>
          <p className="text-sm text-slate-500 mt-0.5">{section.subtitle}</p>
        </div>
        <span className={`text-slate-500 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="px-6 py-6 bg-slate-950 border-t border-slate-800">
          {section.content}
        </div>
      )}
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 mt-4">
      <span className="text-amber-400 shrink-0 text-sm mt-0.5">💡</span>
      <p className="text-sm text-amber-200/80 leading-relaxed">{children}</p>
    </div>
  )
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3 mt-4">
      <span className="text-red-400 shrink-0 text-sm mt-0.5">⚠️</span>
      <p className="text-sm text-red-200/80 leading-relaxed">{children}</p>
    </div>
  )
}

function Example({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-slate-900 border border-slate-700/60 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-slate-800 border-b border-slate-700/60">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function UnitRow({ unit, oz, use }: { unit: string; oz: string; use: string }) {
  return (
    <tr className="border-t border-slate-800">
      <td className="py-2.5 pr-4">
        <code className="text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded">{unit}</code>
      </td>
      <td className="py-2.5 pr-4 text-sm text-slate-300 font-mono">{oz}</td>
      <td className="py-2.5 text-sm text-slate-400">{use}</td>
    </tr>
  )
}

const sections: Section[] = [
  {
    id: 'inventory-units',
    icon: '◈',
    title: 'Inventory Items — Unit Setup',
    subtitle: 'How to pick the right unit, what cases do, and how lb/oz tracking works',
    content: (
      <div className="space-y-6 text-slate-300">
        <p className="text-slate-400 leading-relaxed">
          The unit you pick on an inventory item tells BarGuard how to measure everything — purchases, counts, and recipe deductions. Pick the wrong unit and the math will be off. Here is every option explained plainly.
        </p>

        {/* Spirits */}
        <div>
          <h3 className="font-semibold text-slate-100 mb-3">Spirits &amp; Liquor</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">Unit</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">= Ounces</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest">Use for</th>
                </tr>
              </thead>
              <tbody>
                <UnitRow unit="bottle" oz="25.36 oz" use="Standard 750ml liquor bottle — vodka, whiskey, rum, gin, tequila, etc." />
                <UnitRow unit="1L" oz="33.81 oz" use="1-liter bottles (common in well wells and some rum/vodka brands)" />
                <UnitRow unit="1.75L" oz="59.17 oz" use="Handles / half-gallons (the big ones you buy at Costco)" />
              </tbody>
            </table>
          </div>
          <Tip>
            If it&apos;s a standard liquor bottle from the shelf, pick <strong>bottle (750ml)</strong>. Only switch to 1L or 1.75L if that&apos;s literally the size you carry.
          </Tip>
        </div>

        {/* Beer */}
        <div>
          <h3 className="font-semibold text-slate-100 mb-3">Beer — Bottles &amp; Cans</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">Unit</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">= Ounces</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest">Use for</th>
                </tr>
              </thead>
              <tbody>
                <UnitRow unit="beer_bottle" oz="12 oz" use="Standard 12oz bottle or can — Bud, Coors, Modelo, Corona, etc." />
                <UnitRow unit="beer_bottle_16oz" oz="16 oz" use="16oz tall boy cans or pint bottles" />
                <UnitRow unit="can_16oz" oz="16 oz" use="Same as above — 16oz can" />
              </tbody>
            </table>
          </div>
          <Tip>
            Beer is tracked <strong>per bottle/can</strong> — not per ounce in the glass. When you set up a recipe for &quot;Draft Bud Light,&quot; you map it to 1 beer_bottle, not 12 oz. BarGuard deducts one bottle per beer sold.
          </Tip>
        </div>

        {/* Kegs */}
        <div>
          <h3 className="font-semibold text-slate-100 mb-3">Kegs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">Unit</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">= Ounces</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest">Use for</th>
                </tr>
              </thead>
              <tbody>
                <UnitRow unit="keg" oz="1,984 oz" use="Standard half-barrel keg (15.5 gal)" />
                <UnitRow unit="quarterkeg" oz="992 oz" use="Quarter-barrel keg (7.75 gal)" />
                <UnitRow unit="sixthkeg" oz="661 oz" use="Sixth-barrel / torpedo keg (5.17 gal)" />
              </tbody>
            </table>
          </div>
          <Tip>
            For kegs, recipes use ounces. A 16oz draft pint = 16 oz deducted from your keg inventory. A 10oz glass = 10 oz. Set it up once per beer style and BarGuard handles the rest.
          </Tip>
        </div>

        {/* Wine */}
        <div>
          <h3 className="font-semibold text-slate-100 mb-3">Wine</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">Unit</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">= Ounces</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest">Use for</th>
                </tr>
              </thead>
              <tbody>
                <UnitRow unit="wine_bottle" oz="25.36 oz" use="Standard 750ml wine bottle" />
              </tbody>
            </table>
          </div>
          <Tip>
            A wine bottle is the same 750ml as a liquor bottle, but the pour size is different — typically 5 oz per glass instead of 1.5 oz. In your recipe for &quot;House Red,&quot; set the deduction to 5 oz per glass sold.
          </Tip>
        </div>

        {/* Cases */}
        <div>
          <h3 className="font-semibold text-slate-100 mb-3">Cases (Pack Size)</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            Cases are not a separate unit — they are a multiplier on top of your base unit. You set the <strong>Pack Size</strong> on an item to tell BarGuard how many bottles/cans are in a case.
          </p>
          <Example label="Example: Corona (beer_bottle, pack size 24)">
            <div className="space-y-1.5 text-sm">
              <p className="text-slate-300">• Unit: <code className="text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">beer_bottle</code> (12 oz each)</p>
              <p className="text-slate-300">• Pack size: <strong className="text-slate-100">24</strong></p>
              <p className="text-slate-300">• When you receive a case, enter <strong className="text-slate-100">1 case</strong> → system records 24 bottles</p>
              <p className="text-slate-300">• When you count stock, enter <strong className="text-slate-100">2 cases + 5 loose</strong> → system reads 53 bottles</p>
            </div>
          </Example>
          <Tip>
            Always set pack size if you buy by the case. It makes counting much faster — you just count cases and loose units separately instead of counting every individual bottle.
          </Tip>
        </div>

        {/* Food - Weight */}
        <div>
          <h3 className="font-semibold text-slate-100 mb-3">Food — Weight (lb / oz)</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            Food tracked by weight uses a simple conversion: <strong className="text-slate-200">1 lb = 16 oz</strong>. BarGuard stores everything internally in ounces so it can do the recipe math across units.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">Unit</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">= Ounces</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest">Use for</th>
                </tr>
              </thead>
              <tbody>
                <UnitRow unit="lb" oz="16 oz" use="Items you weigh in pounds — chicken, ground beef, cheese, etc." />
                <UnitRow unit="oz" oz="1 oz" use="Items you measure directly in ounces — spices, sauces" />
              </tbody>
            </table>
          </div>
          <Example label="Example: Ground Beef (unit = lb, 5 lb bag)">
            <div className="space-y-1.5 text-sm">
              <p className="text-slate-300">• You receive a <strong className="text-slate-100">5 lb bag</strong> → enter 5 in purchases → system records 80 oz</p>
              <p className="text-slate-300">• A burger recipe uses <strong className="text-slate-100">6 oz</strong> of beef per burger</p>
              <p className="text-slate-300">• 10 burgers sold → system deducts <strong className="text-slate-100">60 oz (3.75 lb)</strong> from your beef inventory</p>
              <p className="text-slate-300">• You count <strong className="text-slate-100">1.25 lb</strong> remaining → system confirms 20 oz left → matches expected</p>
            </div>
          </Example>
          <Tip>
            When you count food by weight, enter in lbs (e.g., 1.25). BarGuard converts it. You never have to do the lb → oz math yourself.
          </Tip>
        </div>

        {/* Food - Count */}
        <div>
          <h3 className="font-semibold text-slate-100 mb-3">Food — Count (each)</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Use <code className="text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded text-xs">each</code> for anything you count one by one — lemons, limes, eggs, burger buns, taco shells, etc. Recipes deduct whole numbers. No oz conversion needed.
          </p>
          <Example label="Example: Lime (unit = each)">
            <div className="space-y-1.5 text-sm">
              <p className="text-slate-300">• Receive <strong className="text-slate-100">30 limes</strong> → enter 30</p>
              <p className="text-slate-300">• Margarita recipe uses <strong className="text-slate-100">0.5 each</strong> (half a lime)</p>
              <p className="text-slate-300">• 20 margaritas sold → system deducts <strong className="text-slate-100">10 limes</strong></p>
            </div>
          </Example>
        </div>

        {/* Mixers */}
        <div>
          <h3 className="font-semibold text-slate-100 mb-3">Mixers &amp; Non-Alcohol Beverages (gallon / quart / liter)</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            For sodas, juices, syrups, and other pourable mixers you buy in bulk containers:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">Unit</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest pr-4">= Ounces</th>
                  <th className="pb-2 text-xs text-slate-500 uppercase tracking-widest">Use for</th>
                </tr>
              </thead>
              <tbody>
                <UnitRow unit="gallon" oz="128 oz" use="Gallon jugs of juice, simple syrup, soda syrups" />
                <UnitRow unit="quart" oz="32 oz" use="Quart containers" />
                <UnitRow unit="liter" oz="33.81 oz" use="1-liter mixers (soda water, tonic, ginger beer bottles)" />
              </tbody>
            </table>
          </div>
        </div>

        <Warning>
          The most common mistake is setting a spirit to <strong>each</strong> instead of <strong>bottle</strong>. If your unit is &quot;each,&quot; the system can&apos;t convert to ounces and recipe deductions will break. Always use <strong>bottle</strong> for 750ml liquor.
        </Warning>
      </div>
    ),
  },
  {
    id: 'recipe-mapping',
    icon: '◉',
    title: 'Recipe Mapping',
    subtitle: 'How to connect your menu items to the ingredients they use',
    content: (
      <div className="space-y-6 text-slate-300">
        <p className="text-slate-400 leading-relaxed">
          Recipe mapping is the bridge between your sales data and your inventory. Without it, BarGuard can see what you sold but has no idea what inventory to deduct. <strong className="text-slate-200">Every menu item that uses inventory needs a recipe.</strong>
        </p>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">What Is a Recipe?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            A recipe is a list of ingredients (inventory items) and how much of each one gets used when that menu item is sold. When BarGuard sees a sale come in from your POS, it looks up the recipe and deducts each ingredient from your expected inventory.
          </p>
          <Example label="Example: Margarita recipe">
            <div className="space-y-1.5 text-sm">
              <p className="text-slate-300">Menu item: <strong className="text-slate-100">Margarita</strong></p>
              <div className="mt-2 space-y-1">
                <p className="text-slate-400">↳ <span className="text-slate-200">Tequila</span> — 2 oz</p>
                <p className="text-slate-400">↳ <span className="text-slate-200">Triple Sec</span> — 1 oz</p>
                <p className="text-slate-400">↳ <span className="text-slate-200">Lime Juice</span> — 1 oz</p>
              </div>
              <p className="text-slate-500 mt-3 text-xs">Every time a Margarita is sold, BarGuard deducts 2 oz of Tequila, 1 oz of Triple Sec, and 1 oz of Lime Juice from your expected on-hand amounts.</p>
            </div>
          </Example>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">How to Set One Up</h3>
          <ol className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">1.</span>
              <span>Go to <strong className="text-slate-200">Recipe Mapping</strong> in the sidebar.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">2.</span>
              <span>Find the menu item you want to map (e.g., &quot;Margarita&quot;). If it&apos;s not there yet, it hasn&apos;t been pulled from your POS — check your POS connection or add it manually.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">3.</span>
              <span>Click <strong className="text-slate-200">Add Ingredient</strong>. Search for the inventory item (e.g., &quot;Tequila&quot;) and enter how many ounces are used per drink.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">4.</span>
              <span>Repeat for every ingredient in the drink. Save when done.</span>
            </li>
          </ol>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">Units in Recipes</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            Recipes always use the same unit family as the inventory item. Here is how it works:
          </p>
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 text-sm">
              <p className="text-slate-200 font-medium mb-1">Spirits (bottle, 1L, 1.75L)</p>
              <p className="text-slate-400">Enter the deduction in <strong className="text-slate-200">oz</strong>. A standard pour is 1.5 oz. A double is 3 oz. BarGuard converts the oz deduction against the full bottle&apos;s oz value.</p>
            </div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 text-sm">
              <p className="text-slate-200 font-medium mb-1">Beer bottles &amp; cans (beer_bottle, beer_bottle_16oz)</p>
              <p className="text-slate-400">Enter <strong className="text-slate-200">1</strong> for one beer sold. Beer is tracked per container, not per ounce poured. One sale = one beer_bottle deducted.</p>
            </div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 text-sm">
              <p className="text-slate-200 font-medium mb-1">Kegs (keg, quarterkeg, sixthkeg)</p>
              <p className="text-slate-400">Enter the pour size in <strong className="text-slate-200">oz</strong>. A 16oz draft pint = 16. A 10oz taster = 10. BarGuard deducts that many oz from your keg total.</p>
            </div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 text-sm">
              <p className="text-slate-200 font-medium mb-1">Food by weight (lb)</p>
              <p className="text-slate-400">Enter the portion in <strong className="text-slate-200">oz</strong>. A 6-oz burger patty = 6. BarGuard converts that against your lb inventory (6 oz = 0.375 lb deducted).</p>
            </div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 text-sm">
              <p className="text-slate-200 font-medium mb-1">Food by count (each)</p>
              <p className="text-slate-400">Enter how many of that item get used. Half a lime = 0.5. Two buns = 2. No oz conversion — it&apos;s just a count.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">What Happens Without a Recipe?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            If a menu item has no recipe, BarGuard skips it when calculating variance. That drink could be selling all night and nothing gets deducted — so your variance report will show you &quot;missing&quot; inventory that the system never accounted for. Always map your high-volume items first.
          </p>
        </div>

        <Tip>
          Use the <strong>AI Recipe Suggestions</strong> button to let BarGuard auto-generate recipes based on the drink name. It&apos;s not perfect but it gets you 80% of the way there fast — then you just review and adjust the oz amounts.
        </Tip>

        <Warning>
          Do not add garnishes (salt rim, lime wedge) as recipe ingredients unless you actually track those items in inventory. Only add ingredients that are in your Inventory Items list.
        </Warning>
      </div>
    ),
  },
  {
    id: 'modifier-rules',
    icon: '◧',
    title: 'Modifier Rules',
    subtitle: 'How to handle substitutions, extras, and "no X" orders from your POS',
    content: (
      <div className="space-y-6 text-slate-300">
        <p className="text-slate-400 leading-relaxed">
          When a customer orders &quot;No Cheese&quot; or &quot;Extra Ranch,&quot; your POS sends that as a modifier alongside the main item. Modifier Rules tell BarGuard what to do with those modifiers — specifically, how to adjust the recipe deduction.
        </p>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">What Is a Modifier?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            A modifier is an add-on or change that a customer requests. Your POS records it as a line item attached to the main order. Examples: &quot;No Onions,&quot; &quot;Add Bacon,&quot; &quot;Extra Cheese,&quot; &quot;Sub Ranch.&quot;
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mt-2">
            Without modifier rules, BarGuard ignores these and just runs the standard recipe. That means if someone orders &quot;No Chicken&quot; on a salad, BarGuard still deducts chicken from your inventory — which makes your variance look off.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">The Two Types of Rules</h3>
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 text-sm">
              <p className="text-slate-200 font-semibold mb-1">1. Specific Item Rule</p>
              <p className="text-slate-400">When this modifier appears, remove or add a <strong className="text-slate-200">specific ingredient</strong> from the recipe.</p>
              <Example label='Example: "No Cheese" modifier'>
                <p className="text-sm text-slate-400">Remove <span className="text-slate-200 font-medium">Shredded Cheese</span> from the recipe deduction → BarGuard does not deduct cheese when this modifier is present.</p>
              </Example>
            </div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 text-sm">
              <p className="text-slate-200 font-semibold mb-1">2. Category Rule</p>
              <p className="text-slate-400">When this modifier appears, remove or swap any ingredient that belongs to a <strong className="text-slate-200">category</strong> in the recipe. Useful when the same modifier applies to different items (e.g., &quot;No Cheese&quot; could apply to cheddar, swiss, or American depending on the menu item).</p>
              <Example label='Example: "Sub Ranch" modifier'>
                <p className="text-sm text-slate-400">Replace any ingredient in the <span className="text-slate-200 font-medium">Sauce</span> category with Ranch → works across all menu items that have a sauce, regardless of which specific sauce is in their base recipe.</p>
              </Example>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">How to Set One Up</h3>
          <ol className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">1.</span>
              <span>Go to <strong className="text-slate-200">Modifier Rules</strong> in the sidebar.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">2.</span>
              <span>You&apos;ll see a list of modifiers that have appeared in your POS data. Find the one you want to configure.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">3.</span>
              <span>Choose <strong className="text-slate-200">Remove</strong> (skip the ingredient), <strong className="text-slate-200">Add</strong> (deduct an extra ingredient), or <strong className="text-slate-200">Swap</strong> (replace one ingredient with another).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">4.</span>
              <span>Pick whether to target a specific inventory item or a whole category, then save.</span>
            </li>
          </ol>
        </div>

        <Tip>
          Modifier rules are optional. If you only track spirits and beer, you probably don&apos;t need them. They matter most for kitchens with lots of substitutions that affect high-cost ingredients like proteins, cheese, or premium add-ons.
        </Tip>

        <Warning>
          Modifiers only fire during variance calculation if the modifier text from your POS matches the rule exactly (or starts with No / Extra / Sub / Add). If a modifier isn&apos;t triggering, check the exact text your POS is sending — you can see it in the <strong>Sales Log</strong> under raw item names.
        </Warning>
      </div>
    ),
  },
  {
    id: 'how-variance-works',
    icon: '◐',
    title: 'How Variance Works',
    subtitle: 'The math behind your loss reports — explained simply',
    content: (
      <div className="space-y-6 text-slate-300">
        <p className="text-slate-400 leading-relaxed">
          Variance is the gap between what BarGuard expected you to have and what you actually counted. A big gap = something is wrong — over-pouring, theft, waste, or a recipe that&apos;s set up incorrectly.
        </p>

        <div>
          <h3 className="font-semibold text-slate-100 mb-3">The Formula</h3>
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5 font-mono text-sm">
            <p className="text-slate-300">( Last Count + Purchases Since ) − Sales Deductions = <span className="text-amber-300">Expected On Hand</span></p>
            <p className="mt-3 text-slate-300"><span className="text-amber-300">Expected On Hand</span> − Actual Count = <span className={`text-red-400`}>Variance</span></p>
          </div>
          <Example label="Example: Tequila bottle">
            <div className="space-y-1.5 text-sm">
              <p className="text-slate-300">Last count: <strong className="text-slate-100">3 bottles</strong> (76.1 oz)</p>
              <p className="text-slate-300">Purchases since: <strong className="text-slate-100">2 bottles</strong> (50.7 oz)</p>
              <p className="text-slate-300">Margaritas sold: <strong className="text-slate-100">30 drinks × 2 oz = 60 oz</strong></p>
              <div className="border-t border-slate-700 mt-2 pt-2">
                <p className="text-slate-200">Expected: 76.1 + 50.7 − 60 = <strong className="text-amber-300">66.8 oz (2.63 bottles)</strong></p>
                <p className="text-slate-200">You count: <strong className="text-slate-100">2 bottles</strong> (50.7 oz)</p>
                <p className="text-red-300 font-semibold mt-1">Variance: −16.1 oz missing ⚠️</p>
              </div>
            </div>
          </Example>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">What Causes Variance?</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Heavy pours', 'Bartender is consistently pouring more than the recipe calls for'],
              ['Theft', 'Product leaving without being rung in'],
              ['Waste', 'Spills, mistakes, comps not recorded'],
              ['Wrong recipe oz', 'Your recipe says 1.5 oz but you actually pour 2 oz — fix the recipe'],
              ['Missing a sale', 'A menu item was sold but has no recipe — nothing got deducted'],
              ['Miscounted inventory', 'The opening or closing count was off'],
            ].map(([cause, detail]) => (
              <div key={cause} className="flex gap-3 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5">
                <span className="text-red-400 shrink-0">→</span>
                <div>
                  <span className="text-slate-200 font-medium">{cause}: </span>
                  <span className="text-slate-400">{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Tip>
          A small variance (under 3%) is normal — there&apos;s always some measurement error in counts. Variance over 5% on a spirit is worth investigating. Variance over 10% is a red flag.
        </Tip>
      </div>
    ),
  },
  {
    id: 'name-aliases',
    icon: '⇢',
    title: 'Name Aliases',
    subtitle: 'When your POS name and your inventory item name do not match',
    content: (
      <div className="space-y-6 text-slate-300">
        <p className="text-slate-400 leading-relaxed">
          Your POS might call something &quot;Grey Goose&quot; but your inventory item is named &quot;Grey Goose Vodka.&quot; Aliases tell BarGuard that those two names refer to the same thing.
        </p>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">When Do You Need an Alias?</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex gap-2"><span className="text-amber-400">•</span> Your POS shortens names (&quot;Jack D&quot; instead of &quot;Jack Daniel&apos;s Tennessee Whiskey&quot;)</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> Your POS uses a different abbreviation (&quot;LT Beer&quot; vs &quot;Bud Light&quot;)</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> A menu item name changed but the inventory item name didn&apos;t</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> You get invoice line items with distributor product codes that don&apos;t match your names</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">How to Add One</h3>
          <ol className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">1.</span>
              <span>Go to <strong className="text-slate-200">Name Aliases</strong> in the sidebar.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">2.</span>
              <span>Enter the <strong className="text-slate-200">raw name</strong> (the exact text from your POS or invoice — copy it exactly, it&apos;s case-sensitive).</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">3.</span>
              <span>Select which <strong className="text-slate-200">inventory item</strong> it maps to.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400 font-bold shrink-0">4.</span>
              <span>Save. From now on, every time that raw name appears in a sale or purchase, BarGuard recognizes it automatically.</span>
            </li>
          </ol>
        </div>

        <Tip>
          When an item shows up in your Sales Log as &quot;Unmatched,&quot; that&apos;s BarGuard telling you it can&apos;t find a recipe for it. The fix is either: (a) create a recipe for the menu item, or (b) add an alias so the POS name maps to an existing inventory item.
        </Tip>
      </div>
    ),
  },
  {
    id: 'pos-setup',
    icon: '⇋',
    title: 'POS Connection Setup',
    subtitle: 'How sales data flows into BarGuard from your point-of-sale system',
    content: (
      <div className="space-y-6 text-slate-300">
        <p className="text-slate-400 leading-relaxed">
          BarGuard connects to your POS to pull sales data automatically. Once connected, every sale your POS records gets imported every 5 minutes — no manual exports needed.
        </p>

        <div>
          <h3 className="font-semibold text-slate-100 mb-3">Supported POS Systems</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { name: 'Square', type: 'OAuth login', note: 'Authorize via Square account — no passwords shared' },
              { name: 'Toast', type: 'API credentials', note: 'Enter your Toast API keys from Toast Web' },
              { name: 'Clover', type: 'OAuth login', note: 'Authorize via Clover account' },
              { name: 'Focus POS', type: 'Credentials', note: 'Enter subdomain + store key from your Focus dealer' },
            ].map((pos) => (
              <div key={pos.name} className="bg-slate-900 border border-slate-700/50 rounded-lg p-4">
                <p className="text-slate-100 font-semibold">{pos.name}</p>
                <p className="text-amber-400 text-xs mt-0.5">{pos.type}</p>
                <p className="text-slate-400 text-xs mt-1">{pos.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">What Gets Imported</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex gap-2"><span className="text-amber-400">•</span> Every line-item sale with the menu item name, quantity, and timestamp</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> Modifiers attached to each sale (e.g., &quot;No Cheese,&quot; &quot;Add Bacon&quot;)</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> Revenue per item for profit tracking</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-slate-100 mb-2">After Connection</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            After connecting, BarGuard will pull your menu items and sales history. Your first step is to go to <strong className="text-slate-200">Recipe Mapping</strong> and map your top-selling items to their ingredients. The more items you map, the more accurate your variance reports will be.
          </p>
        </div>

        <Tip>
          Connect your POS before you do anything else. Menu items come from your POS — if you try to set up recipes before connecting, you won&apos;t have any menu items to map.
        </Tip>
      </div>
    ),
  },
]

export default function HelpPage() {
  const [openId, setOpenId] = useState<string | null>('inventory-units')

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Setup Guide</h1>
        <p className="mt-2 text-slate-400 text-sm leading-relaxed">
          Everything you need to know to get BarGuard tracking your inventory accurately — units, recipes, modifiers, and how the math works. Click a topic to expand it.
        </p>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpenId(s.id)}
            className={`text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
              openId === s.id
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span className="mr-1.5">{s.icon}</span>
            {s.title}
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {sections.map((s) => (
          <AccordionSection
            key={s.id}
            section={s}
            open={openId === s.id}
            onToggle={() => toggle(s.id)}
          />
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-slate-600">
        Something not covered here? Contact support at{' '}
        <a href="mailto:support@barguard.app" className="text-slate-500 hover:text-slate-400 transition-colors">
          support@barguard.app
        </a>
      </p>
    </div>
  )
}
