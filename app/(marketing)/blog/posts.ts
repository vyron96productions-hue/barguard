export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; text: string }
  | { type: 'stats'; items: { number: string; label: string }[] }
  | { type: 'cta' }

export interface Post {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  content: Block[]
}

export const POSTS: Post[] = [
  {
    slug: 'bar-shrinkage-how-much-are-you-losing',
    title: 'How Much Is Your Bar Losing to Shrinkage? (And How to Stop It)',
    excerpt: 'The average bar loses 20–25% of its inventory to shrinkage every year. Here\'s what\'s causing it, how to calculate your number, and what you can do about it.',
    category: 'Inventory Management',
    date: 'March 18, 2026',
    readTime: '7 min read',
    content: [
      {
        type: 'p',
        text: 'You had a great Saturday night. The bar was packed, drinks were moving, and your register looked solid. But when you count your bottles on Monday morning, something doesn\'t add up. You sold what should have been 18 bottles of vodka — but you\'re missing 22. That gap? That\'s shrinkage. And it\'s one of the most expensive silent problems in the bar industry.',
      },
      {
        type: 'stats',
        items: [
          { number: '20–25%', label: 'of bar inventory lost to shrinkage annually' },
          { number: '$6,000+', label: 'average monthly loss for a mid-volume bar' },
          { number: '75%', label: 'of bars don\'t measure shrinkage consistently' },
          { number: '4x', label: 'more likely to catch loss with systematic tracking' },
        ],
      },
      {
        type: 'h2',
        text: 'What Is Bar Shrinkage?',
      },
      {
        type: 'p',
        text: 'Shrinkage is the difference between what your inventory records say you should have and what you actually have on the shelf. It\'s the gap between theoretical usage — based on your sales data — and actual usage, based on physical bottle counts.',
      },
      {
        type: 'p',
        text: 'Unlike other industries, bar shrinkage is uniquely difficult to track because alcohol is dispensed in small, unmeasured increments dozens or hundreds of times per shift. A half-ounce over-pour here, a free drink there, a bottle that disappears off the back shelf — it all adds up faster than most owners realize.',
      },
      {
        type: 'h2',
        text: 'The 4 Main Causes of Bar Shrinkage',
      },
      {
        type: 'h3',
        text: '1. Theft',
      },
      {
        type: 'p',
        text: 'Internal theft — by bartenders, barbacks, or managers — accounts for roughly 35–40% of bar shrinkage according to industry studies. It takes many forms: bottles walked out the back door, drinks rung up as water but poured as liquor, cash pocketed on unrecorded sales, or simply sipping on shift. The challenge is that theft at the bar level is almost impossible to detect without hard data comparing what was sold versus what was consumed.',
      },
      {
        type: 'h3',
        text: '2. Over-Pouring',
      },
      {
        type: 'p',
        text: 'This is often unintentional but just as costly. A bartender who consistently pours 1.5 oz instead of 1.25 oz — a difference of just a quarter ounce — is effectively giving away 20% of every drink for free. On a busy Friday night with 300 drinks served, that\'s 60 free drinks your customers got but never paid for. Over-pouring is the single largest contributor to shrinkage at high-volume bars.',
      },
      {
        type: 'h3',
        text: '3. Spillage and Waste',
      },
      {
        type: 'p',
        text: 'Spilled drinks, failed cocktails, broken bottles, and over-blended batches all represent real product loss. A standard allowance of 1–2% for spillage is acceptable. If yours is higher, it\'s a training and workflow problem worth addressing.',
      },
      {
        type: 'h3',
        text: '4. Comps and Unauthorized Free Drinks',
      },
      {
        type: 'p',
        text: 'Some comps are intentional and tracked — a manager buys a round for a loyal customer and records it. But many aren\'t. Bartenders buying rounds for friends, sliding a free shot to a regular, or "forgetting" to ring up a drink for the group that tipped well — these all drain your inventory without appearing in your sales data.',
      },
      {
        type: 'callout',
        text: 'Industry benchmark: a well-run bar should have shrinkage under 10%. If you\'re over 15%, you have a serious, measurable problem. Most bars that don\'t track shrinkage are running at 20–25% without knowing it.',
      },
      {
        type: 'h2',
        text: 'How to Calculate Your Shrinkage Rate',
      },
      {
        type: 'p',
        text: 'Calculating shrinkage requires two numbers: theoretical usage and actual usage.',
      },
      {
        type: 'ol',
        items: [
          'Count your opening inventory at the start of a period (a week or a month works well).',
          'Add any purchases received during the period.',
          'Count your closing inventory at the end of the period.',
          'Calculate actual usage: Opening inventory + Purchases − Closing inventory.',
          'Pull your sales data and calculate theoretical usage: what your POS says you should have sold based on your drink recipes and recorded transactions.',
          'Shrinkage = (Actual usage − Theoretical usage) ÷ Actual usage × 100.',
        ],
      },
      {
        type: 'p',
        text: 'For example: you actually used 30 liters of vodka this week. Your POS says you should have used 24 liters based on recorded sales. Your shrinkage rate is (30 − 24) ÷ 30 = 20%. That\'s $X in unaccounted product — and at 80+ proof spirit prices, it adds up fast.',
      },
      {
        type: 'h2',
        text: 'Red Flags You Have a Shrinkage Problem',
      },
      {
        type: 'ul',
        items: [
          'Your inventory never seems to match your sales numbers, but you can\'t identify why.',
          'Certain bartenders\' sections consistently run low faster than others.',
          'Your pour cost percentage is higher than your recipe costing suggests it should be.',
          'You\'ve noticed bottles moving between shifts without explanation.',
          'Sales on certain spirits are flat but consumption is up.',
          'Staff turnover seems oddly correlated with your inventory discrepancies.',
        ],
      },
      {
        type: 'h2',
        text: 'How to Stop Shrinkage Before It Drains You',
      },
      {
        type: 'p',
        text: 'The most important thing you can do is start measuring. You cannot manage what you don\'t measure, and most shrinkage problems thrive in the dark precisely because ownership doesn\'t have the data to see them.',
      },
      {
        type: 'ul',
        items: [
          'Count inventory on a consistent schedule — weekly is the industry standard.',
          'Compare your actual usage against your POS-based theoretical usage every count cycle.',
          'Track variances by category (spirits, beer, wine, NA) and by location (bar station, back bar, storage).',
          'Use portion control tools — jiggers, measured pourers, or speed rails with standard pours — to reduce accidental over-pouring.',
          'Require comp logging: every free drink should be recorded in the POS against a comp account.',
          'Cross-train managers to review variance reports, not just bartenders to pour drinks.',
        ],
      },
      {
        type: 'p',
        text: 'The bars that get shrinkage under control share one thing: they treat inventory data as seriously as they treat their P&L. Shrinkage isn\'t a moral failing — it\'s a data problem. Give yourself the data, and you can fix it.',
      },
      {
        type: 'cta',
      },
    ],
  },
  {
    slug: 'bar-inventory-management-guide',
    title: 'Bar Inventory Management: The Complete Guide for Bar Owners',
    excerpt: 'Most bars are losing thousands of dollars a month to poor inventory tracking. This guide walks you through how to set up a real system — and the key numbers you need to watch.',
    category: 'Operations',
    date: 'March 10, 2026',
    readTime: '9 min read',
    content: [
      {
        type: 'p',
        text: 'Ask ten bar owners how they manage inventory and you\'ll get ten different answers — everything from a clipboard spreadsheet to "I kind of just eyeball it." The eyeball method feels fast and easy until the month you realize you can\'t explain a $4,000 gap between what you sold and what you bought. Inventory management isn\'t glamorous, but it\'s the foundation of a profitable bar.',
      },
      {
        type: 'h2',
        text: 'Why Bar Inventory Management Is Different',
      },
      {
        type: 'p',
        text: 'Bar inventory is harder to manage than retail or restaurant inventory for one simple reason: every product is dispensed in small, variable increments, hundreds of times per shift, by multiple people, without a scan or a weigh. A 750ml bottle of whiskey might yield 16 drinks — or 12, depending on who\'s pouring. That variability is where your money goes.',
      },
      {
        type: 'p',
        text: 'In retail, if a bottle of whiskey leaves the shelf, it\'s scanned and recorded. In a bar, when a quarter of that same bottle disappears into a glass, it often disappears from your accounting too. Good inventory management bridges that gap.',
      },
      {
        type: 'stats',
        items: [
          { number: '3–9%', label: 'ideal pour cost as % of revenue' },
          { number: '$1,000+', label: 'average weekly loss from untracked inventory' },
          { number: '10%', label: 'target max shrinkage rate' },
          { number: '52x', label: 'inventory counts per year for weekly trackers' },
        ],
      },
      {
        type: 'h2',
        text: 'The Core Metrics Every Bar Owner Should Track',
      },
      {
        type: 'h3',
        text: 'Pour Cost Percentage',
      },
      {
        type: 'p',
        text: 'Pour cost is the cost of goods sold divided by revenue from that category. If you buy a bottle of vodka for $18 and it sells $90 worth of drinks, your pour cost is 20%. Industry targets vary by concept: high-volume bars should aim for 18–22% on spirits, while craft cocktail programs often run 22–28% due to premium ingredients. Knowing your pour cost per category tells you immediately where your margins are leaking.',
      },
      {
        type: 'h3',
        text: 'Variance / Shrinkage Rate',
      },
      {
        type: 'p',
        text: 'Variance is the difference between theoretical usage (based on sales data) and actual usage (based on physical counts). A 5% variance on a high-volume category is a signal. A 20% variance is a crisis. Track this weekly, by product category, and by bar station if you have multiple service areas.',
      },
      {
        type: 'h3',
        text: 'Reorder Points',
      },
      {
        type: 'p',
        text: 'Running out of your top-five spirits on a Saturday night is an operational failure that costs you in both sales and customer experience. Reorder points tell you the minimum quantity at which you need to place a new order. Set them based on your actual usage rate, lead time from your distributor, and a safety buffer for high-demand periods.',
      },
      {
        type: 'h3',
        text: 'Dead Stock',
      },
      {
        type: 'p',
        text: 'Every bottle sitting on your back bar that hasn\'t been touched in 60 days is cash you\'ve already spent that isn\'t working for you. Tracking dead stock and making deliberate decisions about it — menu specials, signature cocktails, returns to distributors — keeps your working capital moving.',
      },
      {
        type: 'h2',
        text: 'How to Set Up a Bar Inventory System',
      },
      {
        type: 'h3',
        text: 'Step 1: Build Your Master Item List',
      },
      {
        type: 'p',
        text: 'Start with a complete list of every product you stock — every spirit, beer, wine, mixer, garnish, and supply item. Include the unit of measure (bottle, keg, case), pack size, your cost per unit, and the category. This becomes your inventory bible. Be meticulous here: getting this wrong creates cascading inaccuracies in every count that follows.',
      },
      {
        type: 'h3',
        text: 'Step 2: Establish Your Count Cadence',
      },
      {
        type: 'p',
        text: 'Weekly counts are the industry standard for spirits and high-cost items. Beer kegs and high-turnover items may warrant twice-weekly counts at busy operations. The important thing is consistency: count on the same day, at the same time (typically before open or after close), every cycle. Inconsistent counting produces noisy data that\'s hard to act on.',
      },
      {
        type: 'h3',
        text: 'Step 3: Connect Your POS Data',
      },
      {
        type: 'p',
        text: 'Your inventory counts alone don\'t tell you much without something to compare them against. Your POS sales data — specifically, the quantities of each menu item sold — is what lets you calculate theoretical usage. Build out your drink recipes (what\'s in each drink and how much) so your system can automatically calculate how much product each sale should have consumed.',
      },
      {
        type: 'h3',
        text: 'Step 4: Run Variance Reports After Every Count',
      },
      {
        type: 'p',
        text: 'After each count, compare actual usage to theoretical usage. Flag any item with variance above your threshold (most operators use 5–10%). Investigate immediately — don\'t let variances accumulate across multiple count cycles before you look at them. The trail goes cold fast.',
      },
      {
        type: 'h3',
        text: 'Step 5: Act on What You Find',
      },
      {
        type: 'p',
        text: 'A variance report that no one acts on is just an expense. When you find a category with consistent over-variance, trace it: Is it one bar station? One shift? One product? Talk to staff, review POS voids and comps, check your camera footage if needed. The goal isn\'t punishment — it\'s plugging the leak.',
      },
      {
        type: 'h2',
        text: 'Common Inventory Mistakes Bar Owners Make',
      },
      {
        type: 'ul',
        items: [
          'Counting only spirits and ignoring beer, wine, and NA beverages.',
          'Using weight or "eyeball" estimates instead of actual bottle counts.',
          'Letting the same person who pours the drinks also count the inventory.',
          'Counting too infrequently — monthly counts hide problems that weekly counts would catch.',
          'Not reconciling purchase orders: if received quantities aren\'t recorded, your counts will always look off.',
          'Having no standard drink recipes, making it impossible to calculate theoretical usage.',
          'Treating variances as a curiosity rather than a management signal.',
        ],
      },
      {
        type: 'callout',
        text: 'Best practice: the person who counts inventory should not be the bartender who was last on shift. Separation of duties is one of the simplest loss-prevention controls a bar can implement.',
      },
      {
        type: 'h2',
        text: 'Manual vs. Software: What\'s Worth It?',
      },
      {
        type: 'p',
        text: 'A spreadsheet can technically do everything described above. The problem is that spreadsheets are slow, error-prone, and produce data that\'s hard to act on without a lot of manual work. They also don\'t connect to your POS, which means theoretical usage calculations have to be done by hand.',
      },
      {
        type: 'p',
        text: 'Inventory software automates the comparison between your counts and your POS data, flags variances instantly, tracks trends over time, and gives you the kind of at-a-glance reporting that makes management decisions easier. For any bar doing more than $10,000 a month in liquor sales, the time savings and loss-detection value of a dedicated system almost always outweighs the cost.',
      },
      {
        type: 'cta',
      },
    ],
  },
  {
    slug: 'over-pouring-bar-losses',
    title: 'Over-Pouring Is Costing Your Bar More Than You Think',
    excerpt: 'A quarter ounce of extra pour per drink doesn\'t sound like much. But across a busy Saturday night, it could mean $200+ in lost revenue — from a single bartender.',
    category: 'Loss Prevention',
    date: 'March 5, 2026',
    readTime: '6 min read',
    content: [
      {
        type: 'p',
        text: 'Of all the ways a bar loses money, over-pouring is the most democratic. It doesn\'t require bad intentions. Your best bartender — the one who\'s fast, charming, and regulars love — might be your biggest over-pourer. They\'ve got great hands and they\'re generous. Customers love it. Your margins don\'t.',
      },
      {
        type: 'h2',
        text: 'The Math Behind Over-Pouring',
      },
      {
        type: 'p',
        text: 'Let\'s make this concrete. Say your standard pour is 1.5 oz per drink. Your bartender consistently pours 1.75 oz — a quarter ounce over. That\'s a 16.7% over-pour on every single drink.',
      },
      {
        type: 'stats',
        items: [
          { number: '0.25 oz', label: 'typical over-pour per drink (undetected)' },
          { number: '17%', label: 'revenue given away on each over-poured drink' },
          { number: '$180–$240', label: 'lost per bartender on a busy 300-drink shift' },
          { number: '$50,000+', label: 'annual loss for a bar with 2 over-pourers on staff' },
        ],
      },
      {
        type: 'p',
        text: 'On a slow Tuesday, maybe 80 drinks go across the bar. That\'s 20 ounces of extra product given away — roughly $15 in cost, maybe $40 in lost revenue. Not catastrophic.',
      },
      {
        type: 'p',
        text: 'Now it\'s Saturday night. Two bartenders, 400 drinks between them. At a quarter ounce over per drink, you\'ve given away 100 ounces of product. At $3–$4 of retail revenue per ounce for mid-shelf spirits, that\'s $300–$400 in revenue that never made it to your register. Every Saturday. Every week.',
      },
      {
        type: 'h2',
        text: 'Why Over-Pouring Happens',
      },
      {
        type: 'h3',
        text: 'Free-Pouring Without Training',
      },
      {
        type: 'p',
        text: 'Free-pouring — measuring by count rather than jigger — is fast and looks professional. A trained bartender can free-pour within 5% accuracy. An untrained one can be 30–40% off without knowing it. If your bar trains staff to free-pour but doesn\'t verify their counts regularly, you\'re operating on trust and hoping for the best.',
      },
      {
        type: 'h3',
        text: 'Generosity as Customer Service',
      },
      {
        type: 'p',
        text: 'Good bartenders build regulars. Part of how they do it is by being generous. A heavy pour feels like hospitality. Regulars notice it. They come back. They tip better. The bartender\'s instinct to be generous is actually rational from their perspective — it drives tips. The problem is that generosity with someone else\'s product is only free if ownership isn\'t measuring it.',
      },
      {
        type: 'h3',
        text: 'Rush Period Approximation',
      },
      {
        type: 'p',
        text: 'During a rush, precision goes out the window. A bartender who measures carefully during a slow Tuesday will start approximating when they\'re slammed on Friday night. Speed and accuracy are genuinely in tension at the bar. The solution isn\'t yelling at staff to slow down — it\'s removing the need for manual estimation through consistent tooling.',
      },
      {
        type: 'h2',
        text: 'How to Detect Over-Pouring',
      },
      {
        type: 'p',
        text: 'The only reliable way to detect over-pouring is through the variance between your theoretical usage (what your POS says you should have used, based on drinks sold) and your actual usage (what your physical inventory counts show). If your POS says you sold 40 shots of bourbon but your counts show 52 shots worth of bourbon consumed, the difference is either over-pouring, theft, waste, or comps — and you need to know which.',
      },
      {
        type: 'ul',
        items: [
          'Run theoretical vs. actual comparisons after every inventory count.',
          'Segment variance by product category — over-pouring tends to cluster on your highest-volume spirits.',
          'Correlate variances with shift schedules to identify whether certain staff or certain nights drive the discrepancy.',
          'Use spot checks: measure a bartender\'s pours during a quiet moment without making it confrontational.',
        ],
      },
      {
        type: 'h2',
        text: 'How to Fix Over-Pouring',
      },
      {
        type: 'h3',
        text: 'Standardize with Jiggers',
      },
      {
        type: 'p',
        text: 'Requiring jigger use is the most direct fix. Yes, it\'s slower. Yes, some bartenders will push back. But a measured pour is always going to be more accurate than a counted one, especially under pressure. Many craft cocktail bars have successfully reframed jigger use as quality-focused rather than distrust-signaling.',
      },
      {
        type: 'h3',
        text: 'Train and Test Free-Pour Counts',
      },
      {
        type: 'p',
        text: 'If your bar culture requires free-pouring, invest in real training. The standard test: have bartenders pour into a jigger over a count of 1, 2, 3, 4 seconds, and measure what comes out. Do this regularly — pour counts drift over time, especially with new bottles that pour differently than old ones.',
      },
      {
        type: 'h3',
        text: 'Use Measured Pourers',
      },
      {
        type: 'p',
        text: 'Measured speed pourers — which dispense a fixed volume per pour — are a middle ground between jiggers and free-pouring. They maintain pour speed while enforcing a fixed measurement. They\'re particularly effective on high-volume well spirits where precision matters most.',
      },
      {
        type: 'h3',
        text: 'Make the Data Visible',
      },
      {
        type: 'p',
        text: 'When bartenders know their section\'s pour cost and variance data, behavior changes. This isn\'t about surveillance — it\'s about accountability. Most over-pouring is unintentional. When staff can see the impact of their pours on the bar\'s numbers, they adjust. Visibility is often more powerful than enforcement.',
      },
      {
        type: 'callout',
        text: 'The most effective over-pouring prevention isn\'t catching people after the fact — it\'s making the cost of each pour visible and understood before the shift starts.',
      },
      {
        type: 'h2',
        text: 'The Bottom Line',
      },
      {
        type: 'p',
        text: 'Over-pouring is fixable. It doesn\'t require firing good bartenders or turning your bar into a joyless measuring exercise. It requires data — knowing where your variance is coming from — and targeted action based on what that data shows. The bars that get it under control typically save 3–8% of their liquor revenue, which at any meaningful volume is thousands of dollars a month flowing back to the bottom line.',
      },
      {
        type: 'cta',
      },
    ],
  },
]

export function getPost(slug: string): Post | undefined {
  return POSTS.find(p => p.slug === slug)
}
