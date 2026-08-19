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

export default function AnnouncementBar() {
  const [messages, setMessages] = useState<AnnouncementMessage[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    loadMessages()
    // Auto-refresh cada 5s, mismo patrón que el hero slider,
    // así los cambios hechos desde el admin se reflejan sin recargar
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadMessages() {
    const { data } = await supabase
      .from('announcement_messages')
      .select('*')
      .eq('is_active', true)
      .order('order_position')

    if (data) setMessages(data as AnnouncementMessage[])
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

  return (
    <div className="bg-gray-900 text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-center">
        {current.icon && <span>{current.icon}</span>}
        <span>{current.message}</span>
        {current.link_text && current.link_url && (
          <a href={current.link_url} className="underline font-semibold ml-1 hover:text-white/80 transition-colors">
            {current.link_text}
          </a>
        )}
      </div>
    </div>
  )
}
