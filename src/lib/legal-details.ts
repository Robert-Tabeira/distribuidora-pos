// Complete with the business owner's confirmed information before publishing
// these documents as final. Empty values are intentionally marked as pending.
export const LEGAL_DETAILS = {
  tradingName: 'Los Primos',
  legalName: 'Rusterson Sociedad Anónima',
  registeredAddress: 'Ruta Interbalnearia Km 47 y Calle B, Las Toscas, Canelones, República Oriental del Uruguay',
  privacyContact: 'Atención presencial en el local, en el domicilio indicado.',
  privacyContactHref: '', // Optional: tel: link or WhatsApp URL for the chosen channel.
  retentionDetails: '',
  internationalTransfers: '',
  reviewed: false,
}

export const LEGAL_VERSION = '2026-10-23'
export const LEGAL_DATE_LABEL = '23 de octubre de 2026'
export const LEGAL_READY = Boolean(LEGAL_DETAILS.legalName && LEGAL_DETAILS.registeredAddress && LEGAL_DETAILS.privacyContact && LEGAL_DETAILS.retentionDetails && LEGAL_DETAILS.internationalTransfers && LEGAL_DETAILS.reviewed)

export const LEGAL_LINKS = [
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/terminos', label: 'Términos de uso' },
]
