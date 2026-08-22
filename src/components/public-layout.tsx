import { Header } from '@/components/header'
import AnnouncementBar from '@/components/announcement-bar'
import PopupDisplay from '@/components/popup-display'

// Envoltorio para las páginas PÚBLICAS del sitio (landing, catálogo, etc.)
// No usar esto en pantallas internas (admin, login, caja, mostrador, productos),
// que tienen su propio header y no deben mostrar la barra de anuncios ni pop-ups.
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      {children}
      <PopupDisplay />
    </>
  )
}
