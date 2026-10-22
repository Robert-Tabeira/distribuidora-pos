export interface HeaderNavigationColors {
  text_color?: string
  active_color?: string
  nav_text_color?: string
  nav_active_color?: string
  nav_transparent_text_color?: string
  nav_transparent_active_color?: string
}

/** Shared by the public header and editor previews for both desktop states. */
export function headerNavigationColors(settings: HeaderNavigationColors, overHero: boolean) {
  return overHero
    ? { text: settings.nav_transparent_text_color || '#ffffff', active: settings.nav_transparent_active_color || '#ffffff' }
    : { text: settings.nav_text_color || settings.text_color || '#374151', active: settings.nav_active_color || settings.active_color || '#2563eb' }
}
