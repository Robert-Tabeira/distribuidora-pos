// Confirmed business details and the requested publication state.
// Optional details can be completed later without blocking publication.
export const LEGAL_DETAILS = {
  tradingName: 'Los Primos',
  legalName: 'Rusterson Sociedad Anónima',
  registeredAddress: 'Ruta Interbalnearia Km 47 y Calle B, Las Toscas, Canelones, República Oriental del Uruguay',
  privacyContact: 'Atención presencial en el local, en el domicilio indicado.',
  privacyContactHref: '', // Optional: tel: link or WhatsApp URL for the chosen channel.
  retentionDetails: '',
  internationalTransfers: '',
  published: true,
}

export const LEGAL_VERSION = '2026-10-24'
export const LEGAL_DATE_LABEL = '24 de octubre de 2026'
// Publication control, not a certification of legal compliance.
export const LEGAL_READY = Boolean(LEGAL_DETAILS.published && LEGAL_DETAILS.legalName && LEGAL_DETAILS.registeredAddress && LEGAL_DETAILS.privacyContact)

export const LEGAL_LINKS = [
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/terminos', label: 'Términos de uso' },
]
