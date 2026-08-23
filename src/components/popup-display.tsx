'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PopupFrame, type PopupFrameStyle } from '@/components/popup-frame'

interface Popup extends PopupFrameStyle {
  id: string
  name: string
  is_active: boolean
  order_position: number
  content_mode: 'builder' | 'image'
  title: string | null
  message: string | null
  image_url: string | null
  cta_text: string | null
  cta_url: string | null
  bg_color: string
  text_color: string
  button_bg_color: string
  button_text_color: string
  clickable_image_url: string | null
  clickable_image_link: string | null
  trigger_on_load: boolean
  trigger_on_load_delay: number
  trigger_on_scroll: boolean
  trigger_on_scroll_percent: number
  trigger_on_exit: boolean
  show_on_landing: boolean
  show_on_catalogo: boolean
  show_once_per_session: boolean
}

function isEligibleForPage(popup: Popup, pathname: string) {
  if (pathname === '/catalogo') return popup.show_on_catalogo
  if (pathname === '/landing' || pathname === '/') return popup.show_on_landing
  return false
}

export default function PopupDisplay() {
  const pathname = usePathname()
  const [eligiblePopups, setEligiblePopups] = useState<Popup[]>([])
  const [activePopup, setActivePopup] = useState<Popup | null>(null)

  useEffect(() => {
    loadPopups()
  }, [pathname])

  async function loadPopups() {
    const { data } = await supabase
      .from('popups')
      .select('*')
      .eq('is_active', true)
      .order('order_position')

    if (!data) return

    const eligible = (data as Popup[]).filter(p => {
      if (!isEligibleForPage(p, pathname)) return false
      if (p.show_once_per_session && typeof window !== 'undefined' && sessionStorage.getItem(`popup_shown_${p.id}`)) {
        return false
      }
      return true
    })

    setEligiblePopups(eligible)
  }

  // Configura los disparadores SOLO del primer pop-up elegible (por
  // order_position), para no amontonar varios a la vez. Sus disparadores
  // pueden combinarse: el primero que se cumpla lo muestra.
  useEffect(() => {
    if (eligiblePopups.length === 0) return
    const popup = eligiblePopups[0]

    let timer: ReturnType<typeof setTimeout> | undefined
    let handleScroll: (() => void) | undefined
    let handleExit: ((e: MouseEvent) => void) | undefined
    let shown = false

    function show() {
      if (shown) return
      shown = true
      setActivePopup(popup)
      sessionStorage.setItem(`popup_shown_${popup.id}`, '1')
    }

    if (popup.trigger_on_load) {
      timer = setTimeout(show, Math.max(0, popup.trigger_on_load_delay) * 1000)
    }
    if (popup.trigger_on_scroll) {
      handleScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const scrolled = max > 0 ? (window.scrollY / max) * 100 : 0
        if (scrolled >= popup.trigger_on_scroll_percent) show()
      }
      window.addEventListener('scroll', handleScroll)
    }
    if (popup.trigger_on_exit) {
      handleExit = (e: MouseEvent) => {
        if (e.clientY <= 0) show()
      }
      document.addEventListener('mouseleave', handleExit)
    }

    return () => {
      if (timer) clearTimeout(timer)
      if (handleScroll) window.removeEventListener('scroll', handleScroll)
      if (handleExit) document.removeEventListener('mouseleave', handleExit)
    }
  }, [eligiblePopups])

  function close() {
    setActivePopup(null)
  }

  if (!activePopup) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={close}
    >
      {activePopup.content_mode === 'image' ? (
        <div className="relative max-w-md w-full" onClick={e => e.stopPropagation()}>
          <button
            onClick={close}
            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 z-20"
          >
            ✕
          </button>
          <PopupFrame frame={activePopup} className="overflow-hidden">
            {activePopup.clickable_image_url && (
              activePopup.clickable_image_link ? (
                <a href={activePopup.clickable_image_link}>
                  <img src={activePopup.clickable_image_url} alt={activePopup.name} className="w-full h-auto block" />
                </a>
              ) : (
                <img src={activePopup.clickable_image_url} alt={activePopup.name} className="w-full h-auto block" />
              )
            )}
          </PopupFrame>
        </div>
      ) : (
        <div className="relative max-w-md w-full" onClick={e => e.stopPropagation()}>
          <PopupFrame frame={activePopup} backgroundColor={activePopup.bg_color} className="p-8 text-center shadow-2xl">
            <button
              onClick={close}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-black/10 z-20"
              style={{ color: activePopup.text_color }}
            >
              ✕
            </button>

            <div style={{ color: activePopup.text_color }}>
              {activePopup.image_url && (
                <img src={activePopup.image_url} alt="" className="w-full h-auto rounded-lg mb-4" />
              )}
              {activePopup.title && <h3 className="text-2xl font-black mb-3">{activePopup.title}</h3>}
              {activePopup.message && <p className="mb-6 opacity-90">{activePopup.message}</p>}

              {activePopup.cta_text && activePopup.cta_url && (
                <a
                  href={activePopup.cta_url}
                  className="inline-block px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: activePopup.button_bg_color, color: activePopup.button_text_color }}
                >
                  {activePopup.cta_text}
                </a>
              )}
            </div>
          </PopupFrame>
        </div>
      )}
    </div>
  )
}
