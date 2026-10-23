// Complete with the business owner's confirmed information before publishing
// these documents as final. Empty values are intentionally marked as pending.
export const LEGAL_DETAILS = {
  tradingName: 'Los Primos',
  legalName: '',
  taxId: '',
  registeredAddress: '',
  privacyEmail: '',
  retentionDetails: '',
  internationalTransfers: '',
  reviewed: false,
}

export const LEGAL_VERSION = '2026-10-23'
export const LEGAL_DATE_LABEL = '23 de octubre de 2026'
export const LEGAL_READY = Boolean(LEGAL_DETAILS.legalName && LEGAL_DETAILS.taxId && LEGAL_DETAILS.registeredAddress && LEGAL_DETAILS.privacyEmail && LEGAL_DETAILS.retentionDetails && LEGAL_DETAILS.internationalTransfers && LEGAL_DETAILS.reviewed)

export const LEGAL_LINKS = [
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/cookies', label: 'Cookies y almacenamiento' },
  { href: '/terminos', label: 'Condiciones de uso' },
]
