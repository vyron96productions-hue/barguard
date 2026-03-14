import { NextResponse } from 'next/server'
import { getAuthContext, authErrorResponse } from '@/lib/auth'

type SeedIngredient = { ingredient_name: string; quantity_oz: number; sort_order: number; notes?: string }
type SeedDrink = {
  name: string; category: string; glassware: string; garnish: string | null
  instructions: string; notes: string | null; ingredients: SeedIngredient[]
}

const DRINKS: SeedDrink[] = [
  // ── Popular Classics ──────────────────────────────────────────────────────
  {
    name: 'Old Fashioned', category: 'cocktail', glassware: 'rocks', garnish: 'orange peel + cherry',
    instructions: 'Add sugar cube and bitters to glass, muddle. Add large ice cube and whiskey. Stir 30 seconds. Express orange peel over glass and drop in.',
    notes: 'Can use simple syrup instead of sugar cube.',
    ingredients: [
      { ingredient_name: 'Bourbon or Rye Whiskey', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Simple Syrup', quantity_oz: 0.25, sort_order: 2 },
      { ingredient_name: 'Angostura Bitters', quantity_oz: 0.1, sort_order: 3, notes: '2 dashes' },
    ],
  },
  {
    name: 'Manhattan', category: 'cocktail', glassware: 'coupe or martini', garnish: 'cherry',
    instructions: 'Combine whiskey, vermouth, and bitters in mixing glass with ice. Stir until chilled. Strain into chilled glass. Garnish with cherry.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Rye or Bourbon Whiskey', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Sweet Vermouth', quantity_oz: 1, sort_order: 2 },
      { ingredient_name: 'Angostura Bitters', quantity_oz: 0.1, sort_order: 3, notes: '2 dashes' },
    ],
  },
  {
    name: 'Negroni', category: 'cocktail', glassware: 'rocks', garnish: 'orange slice',
    instructions: 'Combine gin, Campari, and sweet vermouth in mixing glass with ice. Stir until chilled. Strain over large ice cube. Garnish with orange slice.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 1, sort_order: 1 },
      { ingredient_name: 'Campari', quantity_oz: 1, sort_order: 2 },
      { ingredient_name: 'Sweet Vermouth', quantity_oz: 1, sort_order: 3 },
    ],
  },
  {
    name: 'Whiskey Sour', category: 'cocktail', glassware: 'rocks or coupe', garnish: 'lemon wheel + cherry',
    instructions: 'Dry shake all ingredients (no ice) for foam. Add ice, shake again. Strain over ice or into chilled coupe. Garnish.',
    notes: 'Add egg white for a richer foam — optional.',
    ingredients: [
      { ingredient_name: 'Bourbon', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Simple Syrup', quantity_oz: 0.5, sort_order: 3 },
    ],
  },
  {
    name: 'Daiquiri', category: 'cocktail', glassware: 'coupe', garnish: 'lime wheel',
    instructions: 'Combine rum, lime juice, and simple syrup in shaker with ice. Shake vigorously. Double strain into chilled coupe.',
    notes: null,
    ingredients: [
      { ingredient_name: 'White Rum', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 1, sort_order: 2 },
      { ingredient_name: 'Simple Syrup', quantity_oz: 0.75, sort_order: 3 },
    ],
  },
  {
    name: 'Cosmopolitan', category: 'cocktail', glassware: 'martini', garnish: 'orange or lime twist',
    instructions: 'Combine vodka, triple sec, cranberry juice, and lime juice in shaker with ice. Shake well. Strain into chilled martini glass.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Citrus Vodka', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Triple Sec', quantity_oz: 0.5, sort_order: 2 },
      { ingredient_name: 'Cranberry Juice', quantity_oz: 0.5, sort_order: 3 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.25, sort_order: 4 },
    ],
  },
  {
    name: 'Moscow Mule', category: 'cocktail', glassware: 'copper mug', garnish: 'lime wedge + mint sprig',
    instructions: 'Fill copper mug with ice. Add vodka and lime juice. Top with ginger beer. Stir gently. Garnish with lime and mint.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Vodka', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Ginger Beer', quantity_oz: 4, sort_order: 2 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.5, sort_order: 3 },
    ],
  },
  {
    name: 'Long Island Iced Tea', category: 'cocktail', glassware: 'highball', garnish: 'lemon wedge',
    instructions: 'Combine all spirits, sour mix, and triple sec in shaker with ice. Shake. Strain over ice in highball. Top with a splash of cola for color.',
    notes: 'Go easy — this is stronger than it tastes.',
    ingredients: [
      { ingredient_name: 'Vodka', quantity_oz: 0.5, sort_order: 1 },
      { ingredient_name: 'White Rum', quantity_oz: 0.5, sort_order: 2 },
      { ingredient_name: 'Gin', quantity_oz: 0.5, sort_order: 3 },
      { ingredient_name: 'Tequila', quantity_oz: 0.5, sort_order: 4 },
      { ingredient_name: 'Triple Sec', quantity_oz: 0.5, sort_order: 5 },
      { ingredient_name: 'Sweet & Sour Mix', quantity_oz: 1, sort_order: 6 },
      { ingredient_name: 'Cola', quantity_oz: 1, sort_order: 7, notes: 'splash to top' },
    ],
  },
  {
    name: 'Bloody Mary', category: 'cocktail', glassware: 'highball', garnish: 'celery + lemon + pickles',
    instructions: 'Rim glass with celery salt. Fill with ice. Add vodka, tomato juice, lemon juice, Worcestershire, and hot sauce. Season with salt and pepper. Stir. Garnish generously.',
    notes: 'Customize heat level to guest preference.',
    ingredients: [
      { ingredient_name: 'Vodka', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Tomato Juice', quantity_oz: 3, sort_order: 2 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.5, sort_order: 3 },
      { ingredient_name: 'Worcestershire Sauce', quantity_oz: 0.25, sort_order: 4, notes: '3-4 dashes' },
      { ingredient_name: 'Hot Sauce', quantity_oz: 0.1, sort_order: 5, notes: '2 dashes' },
    ],
  },
  {
    name: 'Tequila Sunrise', category: 'cocktail', glassware: 'highball', garnish: 'orange slice + cherry',
    instructions: 'Fill glass with ice. Add tequila and orange juice, stir. Slowly pour grenadine down the side — do not stir. It will sink and create the sunrise gradient.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Tequila', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Orange Juice', quantity_oz: 3, sort_order: 2 },
      { ingredient_name: 'Grenadine', quantity_oz: 0.5, sort_order: 3, notes: 'pour last, do not stir' },
    ],
  },
  {
    name: 'Pina Colada', category: 'cocktail', glassware: 'hurricane or highball', garnish: 'pineapple wedge + cherry',
    instructions: 'Blend rum, pineapple juice, and coconut cream with a cup of ice until smooth. Pour into glass. Garnish.',
    notes: 'Can be made on the rocks instead of blended.',
    ingredients: [
      { ingredient_name: 'White Rum', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Pineapple Juice', quantity_oz: 3, sort_order: 2 },
      { ingredient_name: 'Coconut Cream', quantity_oz: 1.5, sort_order: 3 },
    ],
  },
  {
    name: 'Sex on the Beach', category: 'cocktail', glassware: 'highball', garnish: 'orange slice + cherry',
    instructions: 'Fill glass with ice. Add vodka, peach schnapps, orange juice, and cranberry juice. Stir. Garnish.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Vodka', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Peach Schnapps', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Orange Juice', quantity_oz: 2, sort_order: 3 },
      { ingredient_name: 'Cranberry Juice', quantity_oz: 1, sort_order: 4 },
    ],
  },
  {
    name: 'Aperol Spritz', category: 'cocktail', glassware: 'wine glass', garnish: 'orange slice',
    instructions: 'Fill large wine glass with ice. Add Aperol, then prosecco. Top with splash of soda. Gently stir once. Garnish with orange.',
    notes: '3-2-1 ratio: prosecco, Aperol, soda.',
    ingredients: [
      { ingredient_name: 'Prosecco', quantity_oz: 3, sort_order: 1 },
      { ingredient_name: 'Aperol', quantity_oz: 2, sort_order: 2 },
      { ingredient_name: 'Soda Water', quantity_oz: 1, sort_order: 3 },
    ],
  },
  {
    name: 'Dark & Stormy', category: 'cocktail', glassware: 'highball', garnish: 'lime wedge',
    instructions: 'Fill glass with ice. Add lime juice. Pour ginger beer. Float dark rum on top by pouring over the back of a spoon.',
    notes: 'Gosling\'s Black Seal rum is traditional.',
    ingredients: [
      { ingredient_name: 'Dark Rum', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Ginger Beer', quantity_oz: 4, sort_order: 2 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.5, sort_order: 3 },
    ],
  },
  {
    name: 'Paloma', category: 'cocktail', glassware: 'highball', garnish: 'lime wedge + salt rim',
    instructions: 'Salt rim optional. Fill glass with ice. Add tequila and lime juice. Top with grapefruit soda. Stir gently.',
    notes: 'Jarritos or Squirt grapefruit soda works great.',
    ingredients: [
      { ingredient_name: 'Tequila', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.5, sort_order: 2 },
      { ingredient_name: 'Grapefruit Soda', quantity_oz: 4, sort_order: 3 },
    ],
  },
  {
    name: 'Amaretto Sour', category: 'cocktail', glassware: 'rocks or coupe', garnish: 'lemon wheel + cherry',
    instructions: 'Dry shake amaretto, lemon juice, and simple syrup. Add ice, shake again. Strain over ice. Garnish.',
    notes: 'Add egg white for silky texture.',
    ingredients: [
      { ingredient_name: 'Amaretto', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 1, sort_order: 2 },
      { ingredient_name: 'Simple Syrup', quantity_oz: 0.25, sort_order: 3 },
    ],
  },
  {
    name: 'Rum & Coke', category: 'cocktail', glassware: 'highball', garnish: 'lime wedge',
    instructions: 'Fill glass with ice. Add rum. Top with Coca-Cola. Stir lightly. Squeeze lime and drop in.',
    notes: 'Cuba Libre if you add fresh lime juice.',
    ingredients: [
      { ingredient_name: 'Dark or White Rum', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Coca-Cola', quantity_oz: 4, sort_order: 2 },
    ],
  },
  {
    name: 'Whiskey & Ginger', category: 'cocktail', glassware: 'highball', garnish: 'lime wedge',
    instructions: 'Fill glass with ice. Add whiskey. Top with ginger ale or ginger beer. Stir. Garnish with lime.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Whiskey', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Ginger Ale', quantity_oz: 4, sort_order: 2 },
    ],
  },
  {
    name: 'Harvey Wallbanger', category: 'cocktail', glassware: 'highball', garnish: 'orange slice + cherry',
    instructions: 'Fill glass with ice. Add vodka and orange juice. Float Galliano on top by pouring over the back of a spoon.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Vodka', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Orange Juice', quantity_oz: 4, sort_order: 2 },
      { ingredient_name: 'Galliano', quantity_oz: 0.5, sort_order: 3, notes: 'float on top' },
    ],
  },
  {
    name: 'Black Russian', category: 'cocktail', glassware: 'rocks', garnish: null,
    instructions: 'Fill rocks glass with ice. Add vodka then Kahlua. Stir briefly.',
    notes: 'Add cream to make a White Russian.',
    ingredients: [
      { ingredient_name: 'Vodka', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Kahlua', quantity_oz: 0.75, sort_order: 2 },
    ],
  },
  // ── Shots ─────────────────────────────────────────────────────────────────
  {
    name: 'Jägerbomb', category: 'shot', glassware: 'shot glass + pint glass', garnish: null,
    instructions: 'Pour Jägermeister into shot glass. Pour energy drink into pint glass halfway. Drop shot glass into pint glass.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Jägermeister', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Energy Drink', quantity_oz: 8, sort_order: 2 },
    ],
  },
  {
    name: 'Fireball Shot', category: 'shot', glassware: 'shot glass', garnish: null,
    instructions: 'Pour Fireball Cinnamon Whisky into shot glass. Serve immediately.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Fireball Cinnamon Whisky', quantity_oz: 1.5, sort_order: 1 },
    ],
  },
  {
    name: 'Red Headed Slut', category: 'shot', glassware: 'shot glass', garnish: null,
    instructions: 'Combine Jägermeister, peach schnapps, and cranberry juice in shaker with ice. Shake. Strain into shot glass.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Jägermeister', quantity_oz: 0.75, sort_order: 1 },
      { ingredient_name: 'Peach Schnapps', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Cranberry Juice', quantity_oz: 0.5, sort_order: 3 },
    ],
  },
  {
    name: 'B-52', category: 'shot', glassware: 'shot glass', garnish: null,
    instructions: 'Pour Kahlua into shot glass. Slowly layer Baileys on top over the back of a spoon. Layer Grand Marnier on top of that. Serve unlit or flame briefly.',
    notes: 'Layers must float — pour slowly over a spoon.',
    ingredients: [
      { ingredient_name: 'Kahlua', quantity_oz: 0.5, sort_order: 1 },
      { ingredient_name: 'Baileys Irish Cream', quantity_oz: 0.5, sort_order: 2 },
      { ingredient_name: 'Grand Marnier', quantity_oz: 0.5, sort_order: 3 },
    ],
  },
  {
    name: 'Slippery Nipple', category: 'shot', glassware: 'shot glass', garnish: null,
    instructions: 'Pour Sambuca into shot glass. Slowly layer Baileys on top.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Sambuca', quantity_oz: 0.75, sort_order: 1 },
      { ingredient_name: 'Baileys Irish Cream', quantity_oz: 0.75, sort_order: 2 },
    ],
  },
  {
    name: 'Whiskey Bomb', category: 'shot', glassware: 'shot glass + pint glass', garnish: null,
    instructions: 'Pour whiskey into shot glass. Pour beer into pint glass. Drop shot into pint.',
    notes: 'Also called a Boilermaker.',
    ingredients: [
      { ingredient_name: 'Whiskey', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Draft Beer', quantity_oz: 8, sort_order: 2 },
    ],
  },
  // ── Rare & Classic ────────────────────────────────────────────────────────
  {
    name: 'Last Word', category: 'cocktail', glassware: 'coupe', garnish: 'cherry',
    instructions: 'Equal parts all ingredients. Shake with ice. Double strain into chilled coupe.',
    notes: 'A Prohibition-era classic. Equal parts is the key.',
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 0.75, sort_order: 1 },
      { ingredient_name: 'Green Chartreuse', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Maraschino Liqueur', quantity_oz: 0.75, sort_order: 3 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.75, sort_order: 4 },
    ],
  },
  {
    name: 'Paper Plane', category: 'cocktail', glassware: 'coupe', garnish: null,
    instructions: 'Equal parts all ingredients. Shake with ice. Double strain into chilled coupe.',
    notes: 'Modern classic — equal parts is essential.',
    ingredients: [
      { ingredient_name: 'Bourbon', quantity_oz: 0.75, sort_order: 1 },
      { ingredient_name: 'Aperol', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Amaro Nonino', quantity_oz: 0.75, sort_order: 3 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.75, sort_order: 4 },
    ],
  },
  {
    name: "Bee's Knees", category: 'cocktail', glassware: 'coupe', garnish: 'lemon twist',
    instructions: 'Shake gin, lemon juice, and honey syrup with ice. Double strain into chilled coupe. Garnish with lemon twist.',
    notes: 'Honey syrup: 2 parts honey, 1 part warm water. Stir to combine.',
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Honey Syrup', quantity_oz: 0.5, sort_order: 3 },
    ],
  },
  {
    name: 'French 75', category: 'cocktail', glassware: 'champagne flute', garnish: 'lemon twist',
    instructions: 'Shake gin, lemon juice, and simple syrup with ice. Strain into flute. Top with champagne.',
    notes: 'Can substitute cognac for gin for the original French version.',
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 1, sort_order: 1 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.5, sort_order: 2 },
      { ingredient_name: 'Simple Syrup', quantity_oz: 0.5, sort_order: 3 },
      { ingredient_name: 'Champagne or Prosecco', quantity_oz: 3, sort_order: 4, notes: 'top' },
    ],
  },
  {
    name: 'Sidecar', category: 'cocktail', glassware: 'coupe', garnish: 'sugar rim + lemon twist',
    instructions: 'Sugar rim glass. Shake cognac, triple sec, and lemon juice with ice. Double strain into chilled coupe.',
    notes: null,
    ingredients: [
      { ingredient_name: 'Cognac', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Triple Sec', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.75, sort_order: 3 },
    ],
  },
  {
    name: 'Aviation', category: 'cocktail', glassware: 'coupe', garnish: 'cherry',
    instructions: 'Shake gin, maraschino, crème de violette, and lemon juice with ice. Double strain into chilled coupe. Garnish with cherry.',
    notes: "Crème de violette gives the blue color — don't skip it.",
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Maraschino Liqueur', quantity_oz: 0.5, sort_order: 2 },
      { ingredient_name: 'Crème de Violette', quantity_oz: 0.25, sort_order: 3 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.75, sort_order: 4 },
    ],
  },
  {
    name: 'Corpse Reviver #2', category: 'cocktail', glassware: 'coupe', garnish: 'cherry',
    instructions: 'Rinse chilled coupe with absinthe, discard excess. Equal parts remaining: shake gin, triple sec, Lillet Blanc, and lemon juice with ice. Double strain into rinsed glass.',
    notes: 'A classic hangover cure. The absinthe rinse is essential.',
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 0.75, sort_order: 1 },
      { ingredient_name: 'Triple Sec', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Lillet Blanc', quantity_oz: 0.75, sort_order: 3 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.75, sort_order: 4 },
      { ingredient_name: 'Absinthe', quantity_oz: 0.1, sort_order: 5, notes: 'rinse glass only' },
    ],
  },
  {
    name: 'Clover Club', category: 'cocktail', glassware: 'coupe', garnish: 'raspberries',
    instructions: 'Dry shake gin, lemon juice, raspberry syrup, and egg white. Add ice, shake again vigorously. Double strain into chilled coupe.',
    notes: 'The egg white creates a silky foam head.',
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Raspberry Syrup', quantity_oz: 0.5, sort_order: 3 },
      { ingredient_name: 'Egg White', quantity_oz: 0.5, sort_order: 4 },
    ],
  },
  {
    name: 'Rusty Nail', category: 'cocktail', glassware: 'rocks', garnish: 'lemon twist',
    instructions: 'Fill rocks glass with ice. Add Scotch and Drambuie. Stir gently. Garnish with lemon twist.',
    notes: 'A Rat Pack favorite. Drambuie is a Scotch-honey liqueur.',
    ingredients: [
      { ingredient_name: 'Scotch Whisky', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Drambuie', quantity_oz: 0.75, sort_order: 2 },
    ],
  },
  {
    name: 'Godfather', category: 'cocktail', glassware: 'rocks', garnish: null,
    instructions: 'Fill rocks glass with ice. Add Scotch and amaretto. Stir briefly.',
    notes: 'Godmother uses vodka instead of Scotch.',
    ingredients: [
      { ingredient_name: 'Scotch Whisky', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Amaretto', quantity_oz: 0.75, sort_order: 2 },
    ],
  },
  {
    name: 'Gimlet', category: 'cocktail', glassware: 'coupe or rocks', garnish: 'lime wheel',
    instructions: 'Shake gin and lime juice (and simple syrup if using fresh lime) with ice. Strain into chilled coupe or over ice. Garnish.',
    notes: 'Classic uses Rose\'s lime cordial instead of fresh. Modern uses fresh lime + syrup.',
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Simple Syrup', quantity_oz: 0.5, sort_order: 3 },
    ],
  },
  {
    name: 'Singapore Sling', category: 'cocktail', glassware: 'hurricane or highball', garnish: 'pineapple + cherry',
    instructions: 'Shake gin, lemon juice, simple syrup, grenadine, and Cointreau with ice. Strain into ice-filled glass. Top with pineapple juice. Float cherry brandy on top.',
    notes: 'Raffles Hotel original. Complex but crowd-pleasing.',
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Cherry Brandy', quantity_oz: 0.5, sort_order: 2 },
      { ingredient_name: 'Cointreau', quantity_oz: 0.25, sort_order: 3 },
      { ingredient_name: 'Benedictine', quantity_oz: 0.25, sort_order: 4 },
      { ingredient_name: 'Grenadine', quantity_oz: 0.25, sort_order: 5 },
      { ingredient_name: 'Pineapple Juice', quantity_oz: 4, sort_order: 6 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.5, sort_order: 7 },
      { ingredient_name: 'Angostura Bitters', quantity_oz: 0.1, sort_order: 8, notes: '1 dash' },
    ],
  },
  {
    name: 'Mai Tai', category: 'cocktail', glassware: 'rocks or tiki mug', garnish: 'mint sprig + lime + cherry',
    instructions: 'Shake rums, orange curacao, lime juice, and orgeat with ice. Strain over fresh ice. Garnish elaborately.',
    notes: 'Trader Vic original. Orgeat (almond syrup) is essential — don\'t substitute.',
    ingredients: [
      { ingredient_name: 'Light Rum', quantity_oz: 1, sort_order: 1 },
      { ingredient_name: 'Dark Rum', quantity_oz: 1, sort_order: 2 },
      { ingredient_name: 'Orange Curacao', quantity_oz: 0.75, sort_order: 3 },
      { ingredient_name: 'Orgeat Syrup', quantity_oz: 0.5, sort_order: 4 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.75, sort_order: 5 },
    ],
  },
  {
    name: 'Jungle Bird', category: 'cocktail', glassware: 'rocks or tiki mug', garnish: 'pineapple wedge',
    instructions: 'Shake all ingredients with ice. Strain over fresh ice. Garnish with pineapple.',
    notes: 'A tiki drink with a bitter twist from Campari.',
    ingredients: [
      { ingredient_name: 'Black Rum', quantity_oz: 1.5, sort_order: 1 },
      { ingredient_name: 'Campari', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Pineapple Juice', quantity_oz: 1.5, sort_order: 3 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.5, sort_order: 4 },
      { ingredient_name: 'Simple Syrup', quantity_oz: 0.5, sort_order: 5 },
    ],
  },
  {
    name: 'Penicillin', category: 'cocktail', glassware: 'rocks', garnish: 'candied ginger',
    instructions: 'Shake blended Scotch, lemon juice, honey-ginger syrup with ice. Strain over large ice cube. Float peaty Scotch on top.',
    notes: 'Honey-ginger syrup: simmer 1:1 honey/water with fresh ginger. The Islay float is the signature.',
    ingredients: [
      { ingredient_name: 'Blended Scotch', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Honey Ginger Syrup', quantity_oz: 0.75, sort_order: 3 },
      { ingredient_name: 'Islay Scotch', quantity_oz: 0.25, sort_order: 4, notes: 'float on top' },
    ],
  },
  {
    name: 'Bramble', category: 'cocktail', glassware: 'rocks', garnish: 'lemon wheel + blackberries',
    instructions: 'Shake gin, lemon juice, and simple syrup with ice. Strain over crushed ice. Drizzle crème de mûre over the top.',
    notes: 'Invented by Dick Bradsell in 1980s London.',
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Fresh Lemon Juice', quantity_oz: 1, sort_order: 2 },
      { ingredient_name: 'Simple Syrup', quantity_oz: 0.5, sort_order: 3 },
      { ingredient_name: 'Crème de Mûre', quantity_oz: 0.5, sort_order: 4, notes: 'drizzle on top' },
    ],
  },
  {
    name: 'Southside', category: 'cocktail', glassware: 'coupe', garnish: 'mint sprig',
    instructions: 'Muddle mint with simple syrup in shaker. Add gin, lime juice, and ice. Shake vigorously. Double strain into chilled coupe.',
    notes: 'Often called a "gin mojito." Al Capone\'s alleged favorite.',
    ingredients: [
      { ingredient_name: 'Gin', quantity_oz: 2, sort_order: 1 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Simple Syrup', quantity_oz: 0.5, sort_order: 3 },
      { ingredient_name: 'Fresh Mint', quantity_oz: 0.1, sort_order: 4, notes: '6-8 leaves, muddled' },
    ],
  },
  {
    name: 'Naked and Famous', category: 'cocktail', glassware: 'coupe', garnish: null,
    instructions: 'Equal parts all four. Shake with ice. Double strain into chilled coupe.',
    notes: 'Modern classic — equal parts is the rule.',
    ingredients: [
      { ingredient_name: 'Mezcal', quantity_oz: 0.75, sort_order: 1 },
      { ingredient_name: 'Aperol', quantity_oz: 0.75, sort_order: 2 },
      { ingredient_name: 'Yellow Chartreuse', quantity_oz: 0.75, sort_order: 3 },
      { ingredient_name: 'Fresh Lime Juice', quantity_oz: 0.75, sort_order: 4 },
    ],
  },
]

export async function POST() {
  try {
    const { supabase, businessId } = await getAuthContext()

    let inserted = 0
    let skipped = 0

    for (const drink of DRINKS) {
      const { data: item, error } = await supabase
        .from('drink_library_items')
        .insert({
          business_id: businessId,
          name: drink.name,
          category: drink.category,
          glassware: drink.glassware,
          garnish: drink.garnish,
          instructions: drink.instructions,
          notes: drink.notes,
        })
        .select('id')
        .single()

      if (error || !item) { skipped++; continue }

      if (drink.ingredients.length > 0) {
        await supabase.from('drink_library_ingredients').insert(
          drink.ingredients.map((ing) => ({
            drink_library_id: item.id,
            inventory_item_id: null,
            ingredient_name: ing.ingredient_name,
            quantity_oz: ing.quantity_oz,
            sort_order: ing.sort_order,
            notes: ing.notes ?? null,
          }))
        )
      }

      inserted++
    }

    return NextResponse.json({ inserted, skipped })
  } catch (e) { return authErrorResponse(e) }
}
