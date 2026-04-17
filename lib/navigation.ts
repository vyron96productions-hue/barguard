import type { ClientRole } from '@/lib/client-access'
import { meetsMinimumRole } from '@/lib/client-access'

export interface NavItem {
  href:    string
  label:   string
  icon:    string
  minRole: ClientRole  // minimum role needed to see this item
}

export interface NavSection {
  label: string | null
  items: NavItem[]
}

/** Canonical navigation structure shared by Sidebar and MobileNav */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { href: '/dashboard',    label: 'Dashboard',    icon: '▣', minRole: 'manager' },
    ],
  },
  {
    label: 'Bartender',
    items: [
      { href: '/drink-library', label: 'Drink Library', icon: '◍', minRole: 'employee' },
    ],
  },
  {
    label: 'Manager',
    items: [
      { href: '/stock',              label: 'Stock Levels',       icon: '◫', minRole: 'manager' },
      { href: '/sales',              label: 'Sales Log',          icon: '◎', minRole: 'manager' },
      { href: '/uploads',            label: 'Import Reports',     icon: '⇪', minRole: 'manager' },
      { href: '/email-imports',      label: 'Email Imports',      icon: '⊠', minRole: 'manager' },
      { href: '/purchase-scan',      label: 'Purchase Scan',      icon: '⊡', minRole: 'manager' },
      { href: '/expenses',           label: 'Expenses',           icon: '🧾', minRole: 'manager' },
      { href: '/profit-intelligence',label: 'Profit Intelligence',icon: '◑', minRole: 'manager' },
      { href: '/variance-reports',   label: 'Loss Reports',       icon: '◐', minRole: 'manager' },
      { href: '/reorder',            label: 'Smart Reorder',      icon: '⟳', minRole: 'manager' },
    ],
  },
  {
    label: 'Setup',
    items: [
      { href: '/onboarding',      label: 'Price Setup',      icon: '◬', minRole: 'manager' },
      { href: '/inventory-items', label: 'Inventory Items',  icon: '◈', minRole: 'manager' },
      { href: '/menu-items',      label: 'Recipe Mapping',   icon: '◉', minRole: 'manager' },
      { href: '/modifier-rules',  label: 'Modifier Rules',   icon: '◧', minRole: 'manager' },
      { href: '/aliases',         label: 'Name Aliases',     icon: '⇢', minRole: 'manager' },
      { href: '/vendors',         label: 'Vendors',          icon: '◷', minRole: 'manager' },
      { href: '/connections',     label: 'POS Connections',  icon: '⇋', minRole: 'admin'   },
      { href: '/profile',         label: 'Account Settings', icon: '◎', minRole: 'employee'},
      { href: '/profile/team',    label: 'Team Members',     icon: '⊞', minRole: 'admin'   },
    ],
  },
]

/** Returns the sections/items visible to the given client role. Filters out empty sections. */
export function filteredNavSections(clientRole: ClientRole): NavSection[] {
  return NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => meetsMinimumRole(clientRole, item.minRole)),
    }))
    .filter((section) => section.items.length > 0)
}
