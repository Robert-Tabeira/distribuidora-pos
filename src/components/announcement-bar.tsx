'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AnnouncementMessage {
  id: string
  message: string
  icon: string | null
  link_text: string | null
  link_url: string | null
  order_position: number
  is_active: boolean
}

interface BarSettings {
  bg_color: string
  text_color: string
  font_family: string
  font_size: string
  font_weight: string
  letter_spacing: string
  animation: string
}

const DEFAULT_SETTINGS: BarSettings = {
  bg_color: '#111827',
  text_color: '#ffffff',
  font_family: 'default',
  font_size: '14px',
  font_weight: '500',
  letter_spacing: 'normal',
  animation: 'none'
}

const FONT_FAMILY_MAP: Record<string, string> = {
  default: "'DM Sans', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace"
}

const LETTER_SPACING_MAP: Record<string, string> = {
  normal: 'normal',
  wide: '0.025em',
  wider: '0.05em'
}

// Genera una versión más clara/oscura de un color hex, para el efecto de degradado
function shadeColor(hex: string, percent: number) {
  try {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + percent))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent))
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent))
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  } catch {
    return hex
  }
}

export default function AnnouncementBar() {
  const [messages, setMessages] = useState<AnnouncementMessage[]>([])
  const [settings, setSettings] = useState<BarSettings>(DEFAULT_SETTINGS)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    loadData()
    // Auto-refresh cada 5s, mismo patrón que el hero slider,
    // así los cambios hechos desde el admin se reflejan sin recargar
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const [messagesRes, settingsRes] = await Promise.all([
      supabase
        .from('announcement_messages')
        .select('*')
        .eq('is_active', true)
        .order('order_position'),
      supabase
        .from('announcement_bar_settings')
        .select('*')
        .single()
    ])

    if (messagesRes.data) setMessages(messagesRes.data as AnnouncementMessage[])
    if (settingsRes.data) setSettings(settingsRes.data as BarSettings)
  }

  // Rotación entre mensajes (solo si hay más de uno)
  useEffect(() => {
    if (messages.length <= 1) return
    const rotate = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % messages.length)
    }, 5000)
    return () => clearInterval(rotate)
  }, [messages.length])

  if (messages.length === 0) return null

  const current = messages[activeIndex] || messages[0]
  const animationClass = settings.animation !== 'none' ? `ann-bar-${settings.animation}` : ''
  const isGradient = settings.animation === 'gradient'

  return (
    <div
      className={`ann-bar ${animationClass}`}
      style={
        isGradient
          ? {
              backgroundImage: `linear-gradient(270deg, ${settings.bg_color}, ${shadeColor(settings.bg_color, 45)}, ${settings.bg_color})`,
              color: settings.text_color
            }
          : {
              backgroundColor: settings.bg_color,
              color: settings.text_color
            }
      }
    >
      <style>{`
        .ann-bar-pulse { animation: annBarPulse 2.4s ease-in-out infinite; }
        @keyframes annBarPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }

        .ann-bar-shimmer { position: relative; overflow: hidden; }
        .ann-bar-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: -150%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          animation: annBarShimmer 2.8s ease-in-out infinite;
        }
        @keyframes annBarShimmer {
          0% { left: -60%; }
          100% { left: 130%; }
        }

        .ann-bar-bounce-icon .ann-bar-icon { display: inline-block; animation: annBarBounce 1.2s ease-in-out infinite; }
        @keyframes annBarBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .ann-bar-gradient {
          background-size: 200% 200%;
          animation: annBarGradient 6s ease infinite;
        }
        @keyframes annBarGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div
        className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-center"
        style={{
          fontFamily: FONT_FAMILY_MAP[settings.font_family] || FONT_FAMILY_MAP.default,
          fontSize: settings.font_size,
          fontWeight: settings.font_weight,
          letterSpacing: LETTER_SPACING_MAP[settings.letter_spacing] || 'normal'
        }}
      >
        {current.icon && <span className="ann-bar-icon">{current.icon}</span>}
        <span>{current.message}</span>
        {current.link_text && current.link_url && (
          <a href={current.link_url} className="underline font-semibold ml-1 hover:opacity-80 transition-opacity">
            {current.link_text}
          </a>
        )}
      </div>
    </div>
  )
}
