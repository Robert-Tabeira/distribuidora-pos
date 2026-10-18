export interface SiteFont {
  id: string
  name: string
  url: string
  path: string
}

const BUILT_IN_FONTS: Record<string, string> = {
  inherit: 'inherit',
  default: "'DM Sans', sans-serif",
  dm_sans: "'DM Sans', sans-serif",
  fira_sans: "'Fira Sans', sans-serif",
  lora: "'Lora', Georgia, serif",
  georgia: "Georgia, 'Times New Roman', serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
}

export function getSiteFontFamily(key?: string | null, _fonts: SiteFont[] = []): string {
  if (!key || key === 'inherit') return 'inherit'
  if (key.startsWith('custom:')) {
    const id = key.slice('custom:'.length).replace(/[^a-zA-Z0-9_-]/g, '')
    return id ? `"site-font-${id}", sans-serif` : '"DM Sans", sans-serif'
  }
  return BUILT_IN_FONTS[key] || '"DM Sans", sans-serif'
}

export function siteFontFaceCss(fonts: SiteFont[]): string {
  return fonts.map(font => {
    const id = font.id.replace(/[^a-zA-Z0-9_-]/g, '')
    const url = font.url.replace(/["\\\n\r]/g, '')
    if (!id || !url) return ''
    return `@font-face{font-family:"site-font-${id}";src:url("${url}") format("${font.url.toLowerCase().endsWith('.woff2') ? 'woff2' : font.url.toLowerCase().endsWith('.woff') ? 'woff' : font.url.toLowerCase().endsWith('.otf') ? 'opentype' : font.url.toLowerCase().endsWith('.ttf') ? 'truetype' : 'woff2'}");font-style:normal;font-weight:100 900;font-display:swap}`
  }).filter(Boolean).join('\n')
}
