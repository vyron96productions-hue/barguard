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
  image?: string
  imageAlt?: string
  metaTitle?: string
  metaDescription?: string
  content: Block[]
}

export const POSTS: Post[] = [
  {
    slug: 'how-to-do-a-bar-inventory-count',
    title: 'How to Do a Bar Inventory Count',
    excerpt: 'A bar inventory count only works if your team follows the same method every time. Here is a simple step-by-step process to count bottles accurately and catch costly variance faster.',
    category: 'Operations',
    date: 'April 15, 2026',
    readTime: '8 min read',
    image: '/images/blogs/how-to-do-a-bar-inventory-count.png',
    imageAlt: 'bar manager counting liquor inventory with a clipboard and bottles on shelves',
    metaTitle: 'How to Do a Bar Inventory Count Accurately | BarGuard',
    metaDescription: 'Learn how to do a bar inventory count accurately with a simple step-by-step process for bottles, kegs, and variances that reduces costly mistakes.',
    content: [
      {
        type: 'p',
        text: 'If your counts feel rushed, inconsistent, or impossible to trust, the problem usually is not effort. It is process. A bar inventory count only becomes useful when everyone counts the same way, at the same time, and with the same definitions for partial bottles, cases, and storage locations.',
      },
      {
        type: 'p',
        text: 'The goal is not just to finish inventory. The goal is to produce numbers you can compare week over week, connect to sales data, and use to spot waste, over-pouring, theft, and ordering mistakes. That is why many operators eventually move from spreadsheets to a <a href="/bar-inventory-app">bar inventory app</a> once they want faster counts and cleaner variance reporting.',
      },
      {
        type: 'stats',
        items: [
          { number: '1', label: 'standard process every counter should follow' },
          { number: '2', label: 'full counts recommended each week for spirits' },
          { number: '5-10%', label: 'variance level that usually deserves review' },
          { number: '100%', label: 'of locations counted before purchases are entered' },
        ],
      },
      {
        type: 'h2',
        text: 'Why Count Accuracy Matters',
      },
      {
        type: 'p',
        text: 'An inaccurate count creates bad decisions in every direction. You may think you need to reorder when you do not. You may miss a theft pattern because the last count was off. You may blame bartenders for variance that was actually caused by inconsistent bottle estimates. Accurate counts are what make your pour cost, depletion, and shrinkage numbers believable.',
      },
      {
        type: 'callout',
        text: 'If two different managers would count the same shelf two different ways, your process is not standardized enough yet.',
      },
      {
        type: 'h2',
        text: 'Step 1: Set Up the Count Before You Touch a Bottle',
      },
      {
        type: 'p',
        text: 'Choose a fixed count time, usually before open or right after close, and use that same window every cycle. Print or load the item list in shelf order so counters can move through the room once instead of bouncing around. Separate full bottles, partials, kegs, wine, beer, and back-stock so the team is not making decisions on the fly.',
      },
      {
        type: 'ul',
        items: [
          'Count on the same day and time every week.',
          'Freeze transfers and receiving until the count is complete.',
          'Group inventory sheets by bar, storage room, and service station.',
          'Make sure every item name matches the product your team actually stocks.',
        ],
      },
      {
        type: 'h2',
        text: 'Step 2: Count Full Units First',
      },
      {
        type: 'p',
        text: 'Start with sealed bottles, unopened wine, full kegs, and full cases. These are the fastest numbers to capture and the least subjective. Counting full units first also makes it easier to isolate the slower part of the process later: estimating partial bottles.',
      },
      {
        type: 'p',
        text: 'If you are using a spreadsheet, keep your par levels and purchase units visible during the count so you can catch obvious mistakes early. If you are using <a href="/bar-inventory-app">bar inventory tracking software</a>, this is where shelf-ordered item lists and mobile-friendly counting screens can save a lot of time.',
      },
      {
        type: 'h2',
        text: 'Step 3: Estimate Partial Bottles the Same Way Every Time',
      },
      {
        type: 'p',
        text: 'Partials are where most count quality breaks down. Do not let one person count in quarters, another in tenths, and another by guessing. Pick one method for every spirit bottle in the building and train the whole team on it. Most bars use tenths or quarters. The best method is the one your team can apply consistently.',
      },
      {
        type: 'ol',
        items: [
          'Hold the bottle upright at eye level.',
          'Estimate the remaining liquid using your standard fraction system.',
          'Round the same way every time instead of debating borderline bottles.',
          'Enter the count immediately before moving to the next item.',
        ],
      },
      {
        type: 'p',
        text: 'If a bottle is nearly empty, count it as the nearest agreed fraction instead of creating one-off values. Consistency beats fake precision. A repeatable 0.1 estimate is more useful than a different guess every week.',
      },
      {
        type: 'h2',
        text: 'Step 4: Count Every Storage Location',
      },
      {
        type: 'p',
        text: 'Do not stop at the front bar. Include back bar shelves, keg coolers, walk-ins, liquor rooms, event storage, and any office stash managers keep for emergencies. Missing one storage area makes your count incomplete even if every visible shelf is perfect.',
      },
      {
        type: 'ul',
        items: [
          'Main bar and service wells',
          'Back bar display bottles',
          'Storage rooms and cages',
          'Beer coolers and keg rooms',
          'Satellite bars and private-event setups',
        ],
      },
      {
        type: 'h2',
        text: 'Step 5: Reconcile Purchases and Transfers Immediately',
      },
      {
        type: 'p',
        text: 'Once the physical count is done, confirm that every delivery received since the last count has been entered and that any transfers between locations are recorded. Many bars think they have a shrinkage problem when they really have a paperwork problem. Clean receiving and transfer records are part of count accuracy, not a separate admin task.',
      },
      {
        type: 'h2',
        text: 'Step 6: Review Variance Before the Trail Goes Cold',
      },
      {
        type: 'p',
        text: 'A count is only valuable if someone reviews the results right away. Compare actual depletion to expected depletion from sales and recipes, then flag unusual variance while the week is still fresh. The faster you review, the easier it is to connect discrepancies to a shift, station, event, or receiving issue.',
      },
      {
        type: 'p',
        text: 'Look first at high-value spirits, high-volume pours, and any item with repeated discrepancies. Those are usually the quickest path to finding whether the issue is over-pouring, theft, missed comps, unrecorded waste, or a bad counting habit.',
      },
      {
        type: 'h2',
        text: 'Common Mistakes That Ruin Bar Inventory Counts',
      },
      {
        type: 'ul',
        items: [
          'Letting different people use different partial-bottle methods.',
          'Counting after a delivery has arrived but before it is entered.',
          'Skipping secondary storage areas or event stock.',
          'Changing item names or bottle sizes mid-count.',
          'Waiting days to review variance results.',
          'Treating the count as complete even when team members had to guess on too many items.',
        ],
      },
      {
        type: 'h2',
        text: 'How to Make Counts Faster Without Losing Accuracy',
      },
      {
        type: 'p',
        text: 'The fastest counts are not the ones where people rush. They are the ones where the list is organized in shelf order, the fraction rules are standardized, and the review happens in one system instead of across handwritten sheets and spreadsheets. Speed comes from process design, not from asking managers to work sloppier.',
      },
      {
        type: 'p',
        text: 'If your team is spending hours every week on counts and still struggling to trust the numbers, the process may be ready for software. A dedicated system can reduce manual entry, standardize counting rules, and make it easier to compare counts against sales without building formulas from scratch.',
      },
      {
        type: 'h2',
        text: 'The Bottom Line',
      },
      {
        type: 'p',
        text: 'A good bar inventory count is simple, repeatable, and reviewable. Standardize when you count, how you estimate partials, and how quickly you investigate variance. When those pieces are in place, inventory stops being a chore and starts becoming a control system.',
      },
      {
        type: 'p',
        text: 'If you want a faster process with fewer counting errors, <a href="/bar-inventory-app">see how BarGuard automates your inventory counts</a>.',
      },
      {
        type: 'cta',
      },
    ],
  },
  {
    slug: 'bar-shrinkage-how-much-are-you-losing',
    title: 'How Much Is Your Bar Losing to Shrinkage? (And How to Stop It)',
    excerpt: 'The average bar loses 20–25% of its inventory to shrinkage every year. Here\'s what\'s causing it, how to calculate your number, and what you can do about it.',
    category: 'Inventory Management',
    date: 'March 18, 2026',
    readTime: '7 min read',
    image: '/images/blogs/bar-shrinkage-how-much-are-you-losing.png',
    imageAlt: 'bar owner reviewing inventory shrinkage data',
    metaTitle: 'Bar Shrinkage: Stop Losing $6,000+/Month | BarGuard',
    metaDescription: 'The average bar loses 20–25% of its inventory to shrinkage each year — $6,000+/month for most. Learn to calculate your exact loss and stop it fast.',
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
    image: '/images/blogs/bar-inventory-management-guide.png',
    imageAlt: 'bar inventory management system overview',
    metaTitle: 'Bar Inventory Management: Complete Guide for Bar Owners',
    metaDescription: 'Most bars lose thousands a month to poor inventory tracking. This guide walks you through how to set up a real system and the key numbers to watch.',
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
    image: '/images/blogs/over-pouring-bar-losses.png',
    imageAlt: 'bartender overpouring drink causing bar revenue loss',
    metaTitle: 'Over-Pouring: The Hidden Cost Draining Your Bar Revenue',
    metaDescription: 'A quarter ounce of extra pour per drink costs hundreds per shift. Learn how to detect over-pouring and stop the silent profit leak at your bar.',
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
  {
    slug: 'bartender-theft-signs-prevention',
    title: 'Bartender Theft: How to Know If It\'s Happening at Your Bar',
    excerpt: 'Internal theft is responsible for up to 40% of bar losses — and most owners only find out months later. Here\'s how to recognize the warning signs and stop it without torching your team culture.',
    category: 'Loss Prevention',
    date: 'March 31, 2026',
    metaTitle: 'Bartender Theft: Signs & How to Stop It at Your Bar',
    metaDescription: 'Internal theft causes up to 40% of bar losses — and most owners find out months too late. Learn the warning signs and how to stop it without destroying your team.',
    readTime: '8 min read',
    image: '/images/blogs/bartender-theft-signs-prevention.png',
    imageAlt: 'bar owner detecting bartender theft with inventory data',
    content: [
      {
        type: 'p',
        text: 'Nobody wants to believe their bartender is stealing from them. You hired them. You trained them. Maybe you\'ve known them for years. But the data is uncomfortable: industry studies consistently find that internal theft — by employees, not customers — accounts for 35–40% of all bar shrinkage. That\'s not a rounding error. It\'s a line item.',
      },
      {
        type: 'p',
        text: 'The harder truth is that most bartender theft isn\'t dramatic. It\'s not a case you\'ll catch on camera. It\'s a pattern of small decisions — a drink not rung up, a bottle walked to a friend\'s table, cash pocketed on a round that never hit the register — that compound quietly over months before ownership notices something is wrong.',
      },
      {
        type: 'stats',
        items: [
          { number: '35–40%', label: 'of bar shrinkage caused by internal theft' },
          { number: '18 months', label: 'average time before employee theft is detected' },
          { number: '$1,500/mo', label: 'median monthly loss per offending employee' },
          { number: '90%', label: 'of employee theft goes unreported when detected' },
        ],
      },
      {
        type: 'h2',
        text: 'How Bartender Theft Actually Happens',
      },
      {
        type: 'p',
        text: 'Understanding the methods matters because the red flags are different for each one. Most theft at the bar falls into five categories:',
      },
      {
        type: 'h3',
        text: '1. Short Ringing',
      },
      {
        type: 'p',
        text: 'A customer orders four drinks. The bartender rings up three and pockets the cash difference on the fourth. Done fast enough, it\'s invisible to the customer and to you. Short ringing is most common at high-cash bars with no mandatory POS entry before drinks are made. The tell: cash sales are consistently lower than volume would suggest, but only on certain shifts.',
      },
      {
        type: 'h3',
        text: '2. Sweethearting',
      },
      {
        type: 'p',
        text: 'This is free drinks for friends, regulars, or anyone the bartender wants to impress. A round gets poured and a cash transaction occurs — the bartender rings up nothing, pockets nothing, but your product still disappears. Sweethearting is often thought of as "just being friendly," but at scale it\'s directly reducing your margins. The tell: your usage-to-sales ratio climbs on nights certain staff work, but cash shortages are rare.',
      },
      {
        type: 'h3',
        text: '3. Void and Refund Abuse',
      },
      {
        type: 'p',
        text: 'A bartender rings up a sale, takes cash from the customer, then voids the transaction and keeps the money. Modern POS systems log all voids — but only if someone is reviewing that log. A bartender who knows the manager never checks voids has a nearly risk-free method. The tell: high void rates on certain employees or certain shifts, especially on cash transactions.',
      },
      {
        type: 'h3',
        text: '4. Bottle Walking',
      },
      {
        type: 'p',
        text: 'Bottles disappear. Sometimes it\'s one a week, sometimes more. High-end spirits are the most common target — a $60 bottle of tequila walked out the back door once a week is $3,000 a year gone before you notice the storage count is off. The tell: specific SKUs showing high variance that doesn\'t correlate with sales volume.',
      },
      {
        type: 'h3',
        text: '5. Phantom Inventory Manipulation',
      },
      {
        type: 'p',
        text: 'Less common but most damaging at scale: a bartender or manager who\'s also doing inventory counts can manipulate numbers to cover up ongoing theft. They\'ll count high on items where they\'re stealing to keep the variance invisible. The tell: implausibly clean variance reports, especially if the same person conducts counts every cycle.',
      },
      {
        type: 'callout',
        text: 'The most important structural control you can implement today: never let the same person pour the drinks and count the inventory. Separation of duties eliminates the most dangerous form of loss concealment.',
      },
      {
        type: 'h2',
        text: 'Warning Signs You Should Be Watching For',
      },
      {
        type: 'p',
        text: 'None of these signals alone prove theft. But multiple signals appearing together — especially correlated with specific employees or shifts — is your data telling you to look harder.',
      },
      {
        type: 'ul',
        items: [
          'Inventory variance climbs on the same nights the same bartender is scheduled.',
          'Your cash drawer runs short more frequently on certain shifts, even after tips are reconciled.',
          'Void and comp rates are unusually high for one employee vs. the rest of the team.',
          'Your POS shows low drink counts on nights the bar was visibly busy.',
          'Specific high-value bottles consistently show higher-than-expected depletion.',
          'A bartender\'s section always runs out faster than others, but their sales numbers don\'t reflect it.',
          'You notice friends or regulars of a specific bartender drinking heavily but the table\'s check is small.',
          'Inventory counts seem oddly clean — suspiciously little variance — right after a personnel change.',
        ],
      },
      {
        type: 'h2',
        text: 'How to Catch It: The Data Approach',
      },
      {
        type: 'p',
        text: 'The old approach to catching theft was cameras, tip-offs, and gut instinct. The modern approach is variance data — and it\'s more reliable, less confrontational, and much harder to argue with.',
      },
      {
        type: 'p',
        text: 'The core method is simple: compare what your POS says you sold against what your inventory counts say you consumed. If 30 oz of rum disappeared from your inventory but your POS only shows sales that account for 22 oz, 8 oz is unaccounted for. That 8 oz is your evidence. It doesn\'t tell you who did it — but it tells you theft, waste, or over-pouring is happening at a measurable scale.',
      },
      {
        type: 'ol',
        items: [
          'Run variance reports after every inventory count, broken down by product category.',
          'Cross-reference high-variance days and times with your schedule to see if specific shifts or employees correlate.',
          'Pull your POS void and comp logs weekly — most modern POS systems have this report built in.',
          'Track your cash-over/short by shift and by employee over time. A bartender averaging -$15/shift in cash drawers is a pattern, not bad luck.',
          'If you find a consistent pattern on one employee, document it across at least 3–4 count cycles before acting.',
        ],
      },
      {
        type: 'h2',
        text: 'How to Address It Without Destroying Your Team Culture',
      },
      {
        type: 'p',
        text: 'This is where most owners freeze. The data points at someone. Now what?',
      },
      {
        type: 'p',
        text: 'If the variance is ambiguous — one bad week, no strong pattern — address it structurally rather than personally. Tighten controls, increase count frequency, add a manager review of voids. Make the system harder to exploit without singling anyone out.',
      },
      {
        type: 'p',
        text: 'If the pattern is clear and consistent, have a direct conversation grounded in data, not accusation. "Our variance on vodka has been running 18% over the last four weeks, and it\'s concentrated on Tuesday and Thursday shifts. I need to understand what\'s happening." Let the data do the work. Most people will fold when you show them the numbers.',
      },
      {
        type: 'p',
        text: 'When termination is warranted, consult your state\'s employment laws before acting. Document everything. Your variance reports and POS logs are your paper trail.',
      },
      {
        type: 'h2',
        text: 'Prevention Is Cheaper Than Detection',
      },
      {
        type: 'p',
        text: 'The most effective anti-theft strategy is making theft difficult and detectable before it starts. When your team knows that variance is tracked weekly, that void logs are reviewed, and that inventory is counted by someone other than them — the calculus changes. Most theft is opportunistic, not premeditated. Remove the opportunity.',
      },
      {
        type: 'ul',
        items: [
          'Require POS entry before any drink is poured — no exceptions, no pre-making drinks.',
          'Have a manager or owner review void and comp reports weekly.',
          'Rotate who counts inventory — never the same person two cycles in a row.',
          'Conduct random spot counts mid-week in addition to your regular cycle.',
          'Make variance data visible to your management team so everyone knows it\'s being watched.',
          'Set clear, written policies on comps, employee drinks, and voids so there\'s no gray area.',
        ],
      },
      {
        type: 'callout',
        text: 'Posting a sign that says "inventory is tracked weekly and discrepancies are investigated" is not dramatic — and it works. Deterrence is often more cost-effective than enforcement.',
      },
      {
        type: 'h2',
        text: 'The Bottom Line',
      },
      {
        type: 'p',
        text: 'Bartender theft is an uncomfortable topic, but avoiding it doesn\'t protect your business — it just keeps you in the dark. The good news is that modern inventory tracking makes it easier than ever to see what\'s actually happening at your bar, identify patterns before they become expensive, and address problems with data rather than drama. You don\'t have to run your bar like a prison. You just have to run it like a business.',
      },
      {
        type: 'cta',
      },
    ],
  },
  {
    slug: 'how-to-reduce-liquor-cost-percentage',
    title: 'How to Reduce Liquor Cost Percentage Without Cutting Corners',
    excerpt: 'Your liquor cost percentage can make or break your profitability. Most bar owners try to fix it by cutting quality or raising prices — but the real fix is gaining visibility into where the money is going.',
    category: 'Profitability',
    date: 'April 7, 2026',
    readTime: '7 min read',
    image: '/images/blogs/liquor-cost-control.png',
    imageAlt: 'bartender pouring precise drink with inventory analytics',
    metaTitle: 'How to Reduce Liquor Cost Percentage | BarGuard',
    metaDescription: 'Learn how to reduce liquor cost percentage, stop overpouring, and increase bar profits using real inventory data and smarter tracking.',
    content: [
      {
        type: 'p',
        text: 'If you run a bar, you already know this number matters. Your liquor cost percentage can make or break your profitability.',
      },
      {
        type: 'p',
        text: "But here's where most bar owners go wrong. They try to fix it by cutting quality, raising prices randomly, or blaming staff without actually knowing what is happening behind the bar. And none of that fixes the real issue.",
      },
      {
        type: 'h2',
        text: 'What Is Liquor Cost Percentage',
      },
      {
        type: 'p',
        text: 'Liquor cost percentage is calculated like this: Cost of Liquor Used ÷ Liquor Sales × 100. If you spend $3,000 on liquor and generate $10,000 in sales, your liquor cost is 30%.',
      },
      {
        type: 'stats',
        items: [
          { number: '18–24%', label: 'strong — target this range' },
          { number: '25–28%', label: 'needs attention' },
          { number: '30%+', label: 'profit is leaking' },
          { number: '3–8%', label: 'typical savings after fixing control gaps' },
        ],
      },
      {
        type: 'h2',
        text: 'Why Your Liquor Cost Is Too High',
      },
      {
        type: 'h3',
        text: 'Overpouring',
      },
      {
        type: 'p',
        text: 'Even a small overpour adds up fast. An extra quarter ounce per drink across a busy night can turn into hundreds — or even thousands — in lost revenue.',
      },
      {
        type: 'h3',
        text: 'No Real Inventory Tracking',
      },
      {
        type: 'p',
        text: 'If you are counting inventory once a week, you are already behind. You are not seeing where the loss is happening — only that it already happened.',
      },
      {
        type: 'h3',
        text: 'Inconsistent Recipes',
      },
      {
        type: 'p',
        text: 'If every bartender pours differently, your margins become unpredictable. Without standard recipes, there is no control.',
      },
      {
        type: 'h3',
        text: 'Untracked Waste and Free Drinks',
      },
      {
        type: 'p',
        text: 'Spills, comps, and hookups rarely get tracked. But they still hit your bottom line the same as any other loss.',
      },
      {
        type: 'h2',
        text: 'The Smarter Way to Reduce Liquor Cost',
      },
      {
        type: 'p',
        text: 'You do not fix liquor cost by guessing. You fix it by gaining visibility.',
      },
      {
        type: 'h3',
        text: 'Track Expected vs. Actual Usage',
      },
      {
        type: 'p',
        text: "Instead of just counting bottles, you need to compare what should have been used versus what was actually used. This is called variance tracking. BarGuard runs shift-based calculations that show expected usage, actual usage, variance, and estimated loss in dollars — so the real problem becomes clear immediately.",
      },
      {
        type: 'h3',
        text: 'Standardize Every Drink',
      },
      {
        type: 'p',
        text: 'Every drink should have a defined recipe with exact measurements. No guessing. No freestyle pouring. Consistent recipes are what make your cost projections accurate.',
      },
      {
        type: 'h3',
        text: 'Count Inventory More Frequently',
      },
      {
        type: 'p',
        text: 'Weekly counts are not enough for high-risk items. The faster you catch variance, the less money you lose — and the easier it is to trace the cause.',
      },
      {
        type: 'h3',
        text: 'Focus on High-Risk Items First',
      },
      {
        type: 'p',
        text: 'Not every bottle matters equally. Focus on high-volume and high-cost items first. BarGuard highlights critical and warning items automatically so you know exactly where to look.',
      },
      {
        type: 'h3',
        text: 'Use Data to Manage Your Staff',
      },
      {
        type: 'p',
        text: 'Instead of guessing who is overpouring, you will start seeing patterns. Certain shifts or items will consistently show higher variance. Now you can coach your team with real data instead of assumptions.',
      },
      {
        type: 'callout',
        text: "The bars that get liquor cost under control share one thing: they treat inventory data as seriously as they treat their P&L. Liquor cost isn't a pricing problem — it's a control problem.",
      },
      {
        type: 'h2',
        text: 'What Happens When You Fix This',
      },
      {
        type: 'ul',
        items: [
          'Your margins increase immediately',
          'Waste drops across every category',
          'Staff becomes more consistent with real accountability',
          'You stop guessing your numbers and start running your business with confidence',
        ],
      },
      {
        type: 'h2',
        text: 'Where BarGuard Fits In',
      },
      {
        type: 'p',
        text: 'BarGuard was built to solve this exact problem. It gives you real-time inventory tracking, variance analysis, and full visibility into where your money is going. Instead of wondering why your liquor cost is high, you will know exactly what is causing it.',
      },
      {
        type: 'p',
        text: 'Learn more about how it works on our <a href="/how-it-works">how it works page</a>, or compare plans on our <a href="/pricing">pricing page</a>.',
      },
      {
        type: 'h2',
        text: 'The Bottom Line',
      },
      {
        type: 'p',
        text: 'Most bars do not have a pricing problem. They have a control problem. Fix the control and your liquor cost follows.',
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
