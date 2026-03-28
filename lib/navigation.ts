/** Canonical navigation structure shared by Sidebar and MobileNav */
export const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '▣' },
    ],
  },
  {
    label: 'Bartender',
    items: [
      { href: '/drink-library', label: 'Drink Library', icon: '◍' },
    ],
  },
  {
    label: 'Manager',
    items: [
      { href: '/stock', label: 'Stock Levels', icon: '◫' },
      { href: '/sales', label: 'Sales Log', icon: '◎' },
      { href: '/uploads', label: 'Import Reports', icon: '⇪' },
      { href: '/purchase-scan', label: 'Purchase Scan', icon: '⊡' },
      { href: '/profit-intelligence', label: 'Profit Intelligence', icon: '◑' },
      { href: '/variance-reports', label: 'Loss Reports', icon: '◐' },
      { href: '/reorder', label: 'Smart Reorder', icon: '⟳' },
    ],
  },
  {
    label: 'Setup',
    items: [
      { href: '/inventory-items', label: 'Inventory Items', icon: '◈' },
      { href: '/menu-items', label: 'Recipe Mapping', icon: '◉' },
      { href: '/modifier-rules', label: 'Modifier Rules', icon: '◧' },
      { href: '/vendors', label: 'Vendors', icon: '◷' },
      { href: '/connections', label: 'POS Connections', icon: '⇋' },
      { href: '/profile', label: 'Account Settings', icon: '◎' },
    ],
  },
]
