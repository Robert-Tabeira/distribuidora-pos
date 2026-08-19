'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { uploadImageToSupabase } from '@/lib/image-upload-helper'
import type { Employee } from '@/types/database'

interface ColorSwatch {
  name: string
  hex: string
}

interface WebsiteSettings {
  id: string
  phone_number: string | null
  email: string | null
  address: string | null
  business_hours: string | null
  show_phone?: boolean
  show_email?: boolean
  show_address?: boolean
  show_business_hours?: boolean
  color_palette?: ColorSwatch[]
  site_name?: string
  site_tagline?: string
  logo_url?: string | null
  use_logo_image?: boolean
}

interface MenuLink {
  id: string
  label: string
  url: string
  order_position: number
  is_active: boolean
}

interface HeaderSettings {
  id: string
  bg_color: string
  text_color: string
  active_color: string
  sticky: boolean
  shadow: boolean
}

interface HeroSlide {
  id: string
  order_position: number
  image_url: string
  title: string
  description: string | null
  cta_text: string | null
  cta_url: string | null
  is_active: boolean
}

interface LandingSection {
  id: string
  section_name: string
  title: string | null
  subtitle: string | null
  description: string | null
  image_url: string | null
  is_visible: boolean
}

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
  id: string
  bg_color: string
  text_color: string
  font_family: string
  font_size: string
  font_weight: string
  letter_spacing: string
  animation: string
}

const DEFAULT_PALETTE: ColorSwatch[] = [
  { name: 'Primario', hex: '#1d4ed8' },
  { name: 'Secundario', hex: '#0891b2' },
  { name: 'Acento', hex: '#f59e0b' },
  { name: 'Oscuro', hex: '#111827' },
  { name: 'Claro', hex: '#ffffff' },
  { name: 'Éxito', hex: '#16a34a' },
  { name: 'Alerta', hex: '#dc2626' }
]

// Genera una versión más clara/oscura de un color hex (para previews de degradado)
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

// Selector de color reutilizable: paleta global + color personalizado
function ColorPicker({
  label,
  value,
  onChange,
  palette
}: {
  label: string
  value: string
  onChange: (hex: string) => void
  palette: ColorSwatch[]
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-text-muted mb-2">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        {palette.map((swatch) => (
          <button
            key={swatch.hex}
            type="button"
            title={swatch.name}
            onClick={() => onChange(swatch.hex)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              value.toLowerCase() === swatch.hex.toLowerCase()
                ? 'border-primary scale-110 shadow-md'
                : 'border-white shadow'
            }`}
            style={{ backgroundColor: swatch.hex }}
          />
        ))}

        {/* Custom */}
        <div className="relative w-8 h-8">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Color personalizado"
          />
          <div
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xs pointer-events-none"
            style={{ backgroundColor: !palette.some(s => s.hex.toLowerCase() === value.toLowerCase()) ? value : undefined }}
          >
            {palette.some(s => s.hex.toLowerCase() === value.toLowerCase()) && '🎨'}
          </div>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input !w-28 !py-1.5 text-xs font-mono"
        />
      </div>
    </div>
  )
}

export default function WebsiteEditionPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'settings' | 'sections'>('settings')
  const [sectionView, setSectionView] = useState<'announcement' | 'header' | 'hero' | 'landing' | 'popups' | 'footer'>('announcement')

  // Settings
  const [settings, setSettings] = useState<WebsiteSettings | null>(null)
  const [settingsForm, setSettingsForm] = useState({ 
    phone_number: '', 
    email: '', 
    address: '', 
    business_hours: '',
    show_phone: true,
    show_email: true,
    show_address: true,
    show_business_hours: true
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [editingHero, setEditingHero] = useState<HeroSlide | null>(null)
  const [heroForm, setHeroForm] = useState({ title: '', description: '', cta_text: '', cta_url: '', image_url: '' })
  const [savingHero, setSavingHero] = useState(false)
  const [showHeroModal, setShowHeroModal] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState('')

  // Landing Sections
  const [sections, setSections] = useState<LandingSection[]>([])
  const [editingSection, setEditingSection] = useState<LandingSection | null>(null)
  const [sectionForm, setSectionForm] = useState({ title: '', subtitle: '', description: '', image_url: '' })
  const [savingSection, setSavingSection] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)

  // Announcement Bar
  const [announcements, setAnnouncements] = useState<AnnouncementMessage[]>([])
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementMessage | null>(null)
  const [announcementForm, setAnnouncementForm] = useState({ message: '', icon: '', link_text: '', link_url: '', is_active: true })
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)

  // Paleta de colores global
  const [palette, setPalette] = useState<ColorSwatch[]>(DEFAULT_PALETTE)
  const [savingPalette, setSavingPalette] = useState(false)

  // Diseño de la barra de anuncios
  const [barSettings, setBarSettings] = useState<BarSettings | null>(null)
  const [barForm, setBarForm] = useState({
    bg_color: '#111827',
    text_color: '#ffffff',
    font_family: 'default',
    font_size: '14px',
    font_weight: '500',
    letter_spacing: 'normal',
    animation: 'none'
  })
  const [savingBarSettings, setSavingBarSettings] = useState(false)

  // Header: Logo y Nombre
  const [logoForm, setLogoForm] = useState({
    site_name: 'Los Primos',
    site_tagline: 'Distribuidora Oficial Sarubbi',
    logo_url: '',
    use_logo_image: false
  })
  const [savingLogo, setSavingLogo] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Header: Enlaces de Menú
  const [menuLinks, setMenuLinks] = useState<MenuLink[]>([])
  const [editingMenuLink, setEditingMenuLink] = useState<MenuLink | null>(null)
  const [menuLinkForm, setMenuLinkForm] = useState({ label: '', url: '', is_active: true })
  const [savingMenuLink, setSavingMenuLink] = useState(false)
  const [showMenuLinkModal, setShowMenuLinkModal] = useState(false)

  // Header: Estilo
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings | null>(null)
  const [headerForm, setHeaderForm] = useState({
    bg_color: '#ffffff',
    text_color: '#374151',
    active_color: '#2563eb',
    sticky: true,
    shadow: true
  })
  const [savingHeaderSettings, setSavingHeaderSettings] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    const emp = JSON.parse(stored)
    if (emp.role !== 'admin') {
      router.push('/mostrador')
      return
    }
    setEmployee(emp)
    loadData()
  }, [router])

  async function loadData() {
    try {
      const [settingsRes, heroRes, sectionsRes, announcementsRes, barSettingsRes, menuLinksRes, headerSettingsRes] = await Promise.all([
        supabase.from('website_settings').select('*').single(),
        supabase.from('hero_slides').select('*').order('order_position'),
        supabase.from('landing_sections').select('*').order('section_name'),
        supabase.from('announcement_messages').select('*').order('order_position'),
        supabase.from('announcement_bar_settings').select('*').single(),
        supabase.from('menu_links').select('*').order('order_position'),
        supabase.from('header_settings').select('*').single()
      ])

      if (settingsRes.data) {
        setSettings(settingsRes.data as WebsiteSettings)
        setSettingsForm({
          phone_number: settingsRes.data.phone_number || '',
          email: settingsRes.data.email || '',
          address: settingsRes.data.address || '',
          business_hours: settingsRes.data.business_hours || '',
          show_phone: settingsRes.data.show_phone !== false,
          show_email: settingsRes.data.show_email !== false,
          show_address: settingsRes.data.show_address !== false,
          show_business_hours: settingsRes.data.show_business_hours !== false
        })
        if (settingsRes.data.color_palette && settingsRes.data.color_palette.length > 0) {
          setPalette(settingsRes.data.color_palette as ColorSwatch[])
        }
        setLogoForm({
          site_name: settingsRes.data.site_name || 'Los Primos',
          site_tagline: settingsRes.data.site_tagline || 'Distribuidora Oficial Sarubbi',
          logo_url: settingsRes.data.logo_url || '',
          use_logo_image: settingsRes.data.use_logo_image || false
        })
      }

      if (heroRes.data) setHeroSlides(heroRes.data as HeroSlide[])
      if (sectionsRes.data) setSections(sectionsRes.data as LandingSection[])
      if (announcementsRes.data) setAnnouncements(announcementsRes.data as AnnouncementMessage[])
      if (menuLinksRes.data) setMenuLinks(menuLinksRes.data as MenuLink[])
      if (headerSettingsRes.data) {
        const h = headerSettingsRes.data as HeaderSettings
        setHeaderSettings(h)
        setHeaderForm({
          bg_color: h.bg_color,
          text_color: h.text_color,
          active_color: h.active_color,
          sticky: h.sticky,
          shadow: h.shadow
        })
      }
      if (barSettingsRes.data) {
        const b = barSettingsRes.data as BarSettings
        setBarSettings(b)
        setBarForm({
          bg_color: b.bg_color,
          text_color: b.text_color,
          font_family: b.font_family,
          font_size: b.font_size,
          font_weight: b.font_weight,
          letter_spacing: b.letter_spacing,
          animation: b.animation
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    router.push('/admin')
  }

  // ===== SETTINGS =====
  async function saveSettings() {
    setSettingsMessage(null)

    if (!settingsForm.phone_number.trim()) {
      setSettingsMessage({ 
        type: 'error', 
        text: '⚠️ El teléfono WhatsApp es obligatorio. Por favor ingresa un número.' 
      })
      return
    }

    if (settingsForm.phone_number.trim().length < 5) {
      setSettingsMessage({ 
        type: 'error', 
        text: '⚠️ El teléfono debe tener al menos 5 caracteres (ej: +598 99 123 4567)' 
      })
      return
    }

    setSavingSettings(true)
    try {
      const dataToSave = {
        phone_number: settingsForm.phone_number.trim(),
        email: settingsForm.email.trim() || null,
        address: settingsForm.address.trim() || null,
        business_hours: settingsForm.business_hours.trim() || null,
        show_phone: settingsForm.show_phone,
        show_email: settingsForm.show_email,
        show_address: settingsForm.show_address,
        show_business_hours: settingsForm.show_business_hours,
        updated_at: new Date().toISOString()
      }

      if (settings) {
        const { error } = await supabase
          .from('website_settings')
          .update(dataToSave)
          .eq('id', settings.id)

        if (error) {
          if (error.message.includes('not-null')) {
            setSettingsMessage({ 
              type: 'error', 
              text: '❌ El teléfono es obligatorio y no puede estar vacío' 
            })
          } else if (error.message.includes('violates')) {
            setSettingsMessage({ 
              type: 'error', 
              text: '❌ Verifica los datos ingresados. Algunos campos pueden tener formato incorrecto.' 
            })
          } else {
            setSettingsMessage({ 
              type: 'error', 
              text: `❌ Error: ${error.message}` 
            })
          }
          throw error
        }

        setSettings({
          ...settings,
          ...dataToSave
        })
        setSettingsMessage({ 
          type: 'success', 
          text: '✅ Configuración guardada correctamente' 
        })
      } else {
        const { data, error } = await supabase
          .from('website_settings')
          .insert([dataToSave])
          .select()

        if (error) {
          if (error.message.includes('not-null')) {
            setSettingsMessage({ 
              type: 'error', 
              text: '❌ El teléfono es obligatorio' 
            })
          } else if (error.message.includes('violates')) {
            setSettingsMessage({ 
              type: 'error', 
              text: '❌ Verifica los datos ingresados' 
            })
          } else {
            setSettingsMessage({ 
              type: 'error', 
              text: `❌ Error: ${error.message}` 
            })
          }
          throw error
        }
        if (data) {
          setSettings(data[0] as WebsiteSettings)
          setSettingsMessage({ 
            type: 'success', 
            text: '✅ Configuración creada correctamente' 
          })
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  // ===== IMAGE UPLOAD =====
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const { url, error } = await uploadImageToSupabase(file, 'hero-images')

    if (error) {
      alert(`❌ Error al subir imagen: ${error}`)
    } else {
      setHeroForm({ ...heroForm, image_url: url })
      setImagePreview(url)
      alert('✅ Imagen subida correctamente')
    }

    setUploadingImage(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ===== HERO SLIDES =====
  async function saveHeroSlide() {
    if (!heroForm.title.trim()) {
      alert('⚠️ El título es obligatorio')
      return
    }

    if (!heroForm.image_url.trim()) {
      alert('⚠️ La imagen es obligatoria. Sube una foto.')
      return
    }

    setSavingHero(true)
    try {
      if (editingHero) {
        const { error } = await supabase
          .from('hero_slides')
          .update({
            title: heroForm.title.trim(),
            description: heroForm.description.trim() || null,
            cta_text: heroForm.cta_text.trim() || null,
            cta_url: heroForm.cta_url.trim() || null,
            image_url: heroForm.image_url.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingHero.id)

        if (error) throw error

        setHeroSlides(heroSlides.map(s =>
          s.id === editingHero.id
            ? {
                ...s,
                title: heroForm.title.trim(),
                description: heroForm.description.trim() || null,
                cta_text: heroForm.cta_text.trim() || null,
                cta_url: heroForm.cta_url.trim() || null,
                image_url: heroForm.image_url.trim()
              }
            : s
        ))
      } else {
        const maxOrder = heroSlides.length > 0 ? Math.max(...heroSlides.map(s => s.order_position)) : 0

        const { data, error } = await supabase
          .from('hero_slides')
          .insert([{
            title: heroForm.title.trim(),
            description: heroForm.description.trim() || null,
            cta_text: heroForm.cta_text.trim() || null,
            cta_url: heroForm.cta_url.trim() || null,
            image_url: heroForm.image_url.trim(),
            order_position: maxOrder + 1,
            is_active: true
          }])
          .select()

        if (error) throw error
        if (data) setHeroSlides([...heroSlides, data[0] as HeroSlide])
      }

      setShowHeroModal(false)
      setImagePreview('')
      alert('✅ Slide guardado correctamente')
    } catch (error) {
      console.error('Error saving hero:', error)
      alert('❌ Error al guardar')
    } finally {
      setSavingHero(false)
    }
  }

  async function deleteHeroSlide(heroId: string) {
    if (!confirm('¿Eliminar este slide?')) return

    try {
      const { error } = await supabase.from('hero_slides').delete().eq('id', heroId)
      if (error) throw error
      setHeroSlides(heroSlides.filter(s => s.id !== heroId))
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error al eliminar')
    }
  }

  function openHeroModal(hero?: HeroSlide) {
    if (hero) {
      setEditingHero(hero)
      setHeroForm({
        title: hero.title,
        description: hero.description || '',
        cta_text: hero.cta_text || '',
        cta_url: hero.cta_url || '',
        image_url: hero.image_url
      })
      setImagePreview(hero.image_url)
    } else {
      setEditingHero(null)
      setHeroForm({ title: '', description: '', cta_text: '', cta_url: '', image_url: '' })
      setImagePreview('')
    }
    setShowHeroModal(true)
  }

  // ===== LANDING SECTIONS =====
  async function saveSection() {
    if (!sectionForm.title.trim()) {
      alert('El título es requerido')
      return
    }

    setSavingSection(true)
    try {
      if (editingSection) {
        const { error } = await supabase
          .from('landing_sections')
          .update({
            title: sectionForm.title.trim(),
            subtitle: sectionForm.subtitle.trim() || null,
            description: sectionForm.description.trim() || null,
            image_url: sectionForm.image_url.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSection.id)

        if (error) throw error

        setSections(sections.map(s =>
          s.id === editingSection.id
            ? {
                ...s,
                title: sectionForm.title.trim(),
                subtitle: sectionForm.subtitle.trim() || null,
                description: sectionForm.description.trim() || null,
                image_url: sectionForm.image_url.trim() || null
              }
            : s
        ))
      }

      setShowSectionModal(false)
      alert('✅ Sección guardada')
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Error al guardar')
    } finally {
      setSavingSection(false)
    }
  }

  function openSectionModal(section?: LandingSection) {
    if (section) {
      setEditingSection(section)
      setSectionForm({
        title: section.title || '',
        subtitle: section.subtitle || '',
        description: section.description || '',
        image_url: section.image_url || ''
      })
    } else {
      setEditingSection(null)
      setSectionForm({ title: '', subtitle: '', description: '', image_url: '' })
    }
    setShowSectionModal(true)
  }

  // ===== ANNOUNCEMENT BAR =====
  async function saveAnnouncement() {
    if (!announcementForm.message.trim()) {
      alert('⚠️ El mensaje es obligatorio')
      return
    }

    setSavingAnnouncement(true)
    try {
      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcement_messages')
          .update({
            message: announcementForm.message.trim(),
            icon: announcementForm.icon.trim() || null,
            link_text: announcementForm.link_text.trim() || null,
            link_url: announcementForm.link_url.trim() || null,
            is_active: announcementForm.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAnnouncement.id)

        if (error) throw error

        setAnnouncements(announcements.map(a =>
          a.id === editingAnnouncement.id
            ? {
                ...a,
                message: announcementForm.message.trim(),
                icon: announcementForm.icon.trim() || null,
                link_text: announcementForm.link_text.trim() || null,
                link_url: announcementForm.link_url.trim() || null,
                is_active: announcementForm.is_active
              }
            : a
        ))
      } else {
        const maxOrder = announcements.length > 0 ? Math.max(...announcements.map(a => a.order_position)) : 0

        const { data, error } = await supabase
          .from('announcement_messages')
          .insert([{
            message: announcementForm.message.trim(),
            icon: announcementForm.icon.trim() || null,
            link_text: announcementForm.link_text.trim() || null,
            link_url: announcementForm.link_url.trim() || null,
            is_active: announcementForm.is_active,
            order_position: maxOrder + 1
          }])
          .select()

        if (error) throw error
        if (data) setAnnouncements([...announcements, data[0] as AnnouncementMessage])
      }

      setShowAnnouncementModal(false)
      alert('✅ Mensaje guardado correctamente')
    } catch (error) {
      console.error('Error saving announcement:', error)
      alert('❌ Error al guardar. Verificá que la tabla "announcement_messages" ya exista en Supabase.')
    } finally {
      setSavingAnnouncement(false)
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('¿Eliminar este mensaje?')) return

    try {
      const { error } = await supabase.from('announcement_messages').delete().eq('id', id)
      if (error) throw error
      setAnnouncements(announcements.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('❌ Error al eliminar')
    }
  }

  async function toggleAnnouncementActive(announcement: AnnouncementMessage) {
    try {
      const { error } = await supabase
        .from('announcement_messages')
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id)

      if (error) throw error

      setAnnouncements(announcements.map(a =>
        a.id === announcement.id ? { ...a, is_active: !a.is_active } : a
      ))
    } catch (error) {
      console.error('Error toggling announcement:', error)
      alert('❌ Error al actualizar')
    }
  }

  async function moveAnnouncement(id: string, direction: 'up' | 'down') {
    const sorted = [...announcements].sort((a, b) => a.order_position - b.order_position)
    const idx = sorted.findIndex(a => a.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const current = sorted[idx]
    const swapWith = sorted[swapIdx]

    try {
      await Promise.all([
        supabase.from('announcement_messages').update({ order_position: swapWith.order_position }).eq('id', current.id),
        supabase.from('announcement_messages').update({ order_position: current.order_position }).eq('id', swapWith.id)
      ])

      setAnnouncements(announcements.map(a => {
        if (a.id === current.id) return { ...a, order_position: swapWith.order_position }
        if (a.id === swapWith.id) return { ...a, order_position: current.order_position }
        return a
      }))
    } catch (error) {
      console.error('Error reordering:', error)
      alert('❌ Error al reordenar')
    }
  }

  function openAnnouncementModal(announcement?: AnnouncementMessage) {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setAnnouncementForm({
        message: announcement.message,
        icon: announcement.icon || '',
        link_text: announcement.link_text || '',
        link_url: announcement.link_url || '',
        is_active: announcement.is_active
      })
    } else {
      setEditingAnnouncement(null)
      setAnnouncementForm({ message: '', icon: '', link_text: '', link_url: '', is_active: true })
    }
    setShowAnnouncementModal(true)
  }

  // ===== PALETA DE COLORES =====
  function updatePaletteColor(index: number, field: 'name' | 'hex', value: string) {
    setPalette(palette.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  function addPaletteColor() {
    setPalette([...palette, { name: 'Nuevo color', hex: '#888888' }])
  }

  function removePaletteColor(index: number) {
    setPalette(palette.filter((_, i) => i !== index))
  }

  async function savePalette() {
    if (!settings) return
    setSavingPalette(true)
    try {
      const { error } = await supabase
        .from('website_settings')
        .update({ color_palette: palette, updated_at: new Date().toISOString() })
        .eq('id', settings.id)

      if (error) throw error
      alert('✅ Paleta guardada correctamente')
    } catch (error) {
      console.error('Error saving palette:', error)
      alert('❌ Error al guardar la paleta')
    } finally {
      setSavingPalette(false)
    }
  }

  // ===== HEADER: LOGO Y NOMBRE =====
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const { url, error } = await uploadImageToSupabase(file, 'logo')

    if (error) {
      alert(`❌ Error al subir el logo: ${error}`)
    } else {
      setLogoForm({ ...logoForm, logo_url: url })
    }
    setUploadingLogo(false)
  }

  async function saveLogo() {
    if (!settings) return
    setSavingLogo(true)
    try {
      const { error } = await supabase
        .from('website_settings')
        .update({
          site_name: logoForm.site_name.trim() || 'Los Primos',
          site_tagline: logoForm.site_tagline.trim(),
          logo_url: logoForm.logo_url || null,
          use_logo_image: logoForm.use_logo_image,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)

      if (error) throw error
      alert('✅ Logo y nombre guardados correctamente')
    } catch (error) {
      console.error('Error saving logo:', error)
      alert('❌ Error al guardar')
    } finally {
      setSavingLogo(false)
    }
  }

  // ===== HEADER: ENLACES DE MENÚ =====
  function openMenuLinkModal(link?: MenuLink) {
    if (link) {
      setEditingMenuLink(link)
      setMenuLinkForm({ label: link.label, url: link.url, is_active: link.is_active })
    } else {
      setEditingMenuLink(null)
      setMenuLinkForm({ label: '', url: '', is_active: true })
    }
    setShowMenuLinkModal(true)
  }

  async function saveMenuLink() {
    if (!menuLinkForm.label.trim() || !menuLinkForm.url.trim()) {
      alert('⚠️ El texto y la URL son obligatorios')
      return
    }

    setSavingMenuLink(true)
    try {
      if (editingMenuLink) {
        const { error } = await supabase
          .from('menu_links')
          .update({ label: menuLinkForm.label.trim(), url: menuLinkForm.url.trim(), is_active: menuLinkForm.is_active })
          .eq('id', editingMenuLink.id)

        if (error) throw error
        setMenuLinks(menuLinks.map(l => l.id === editingMenuLink.id ? { ...l, ...menuLinkForm } : l))
      } else {
        const maxOrder = menuLinks.length > 0 ? Math.max(...menuLinks.map(l => l.order_position)) : 0
        const { data, error } = await supabase
          .from('menu_links')
          .insert([{ ...menuLinkForm, label: menuLinkForm.label.trim(), url: menuLinkForm.url.trim(), order_position: maxOrder + 1 }])
          .select()

        if (error) throw error
        if (data) setMenuLinks([...menuLinks, data[0] as MenuLink])
      }

      setShowMenuLinkModal(false)
      alert('✅ Enlace guardado correctamente')
    } catch (error) {
      console.error('Error saving menu link:', error)
      alert('❌ Error al guardar. Verificá que la tabla "menu_links" ya exista en Supabase.')
    } finally {
      setSavingMenuLink(false)
    }
  }

  async function deleteMenuLink(id: string) {
    if (!confirm('¿Eliminar este enlace del menú?')) return
    try {
      const { error } = await supabase.from('menu_links').delete().eq('id', id)
      if (error) throw error
      setMenuLinks(menuLinks.filter(l => l.id !== id))
    } catch (error) {
      console.error('Error deleting menu link:', error)
      alert('❌ Error al eliminar')
    }
  }

  async function toggleMenuLinkActive(link: MenuLink) {
    try {
      const { error } = await supabase.from('menu_links').update({ is_active: !link.is_active }).eq('id', link.id)
      if (error) throw error
      setMenuLinks(menuLinks.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l))
    } catch (error) {
      console.error('Error toggling menu link:', error)
      alert('❌ Error al actualizar')
    }
  }

  async function moveMenuLink(id: string, direction: 'up' | 'down') {
    const sorted = [...menuLinks].sort((a, b) => a.order_position - b.order_position)
    const idx = sorted.findIndex(l => l.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const current = sorted[idx]
    const swapWith = sorted[swapIdx]

    try {
      await Promise.all([
        supabase.from('menu_links').update({ order_position: swapWith.order_position }).eq('id', current.id),
        supabase.from('menu_links').update({ order_position: current.order_position }).eq('id', swapWith.id)
      ])

      setMenuLinks(menuLinks.map(l => {
        if (l.id === current.id) return { ...l, order_position: swapWith.order_position }
        if (l.id === swapWith.id) return { ...l, order_position: current.order_position }
        return l
      }))
    } catch (error) {
      console.error('Error reordering menu links:', error)
      alert('❌ Error al reordenar')
    }
  }

  // ===== HEADER: ESTILO =====
  async function saveHeaderSettings() {
    if (!headerSettings) return
    setSavingHeaderSettings(true)
    try {
      const { error } = await supabase
        .from('header_settings')
        .update({ ...headerForm, updated_at: new Date().toISOString() })
        .eq('id', headerSettings.id)

      if (error) throw error
      setHeaderSettings({ ...headerSettings, ...headerForm })
      alert('✅ Estilo guardado correctamente')
    } catch (error) {
      console.error('Error saving header settings:', error)
      alert('❌ Error al guardar. Verificá que la tabla "header_settings" ya exista en Supabase.')
    } finally {
      setSavingHeaderSettings(false)
    }
  }
  async function saveBarSettings() {
    if (!barSettings) return
    setSavingBarSettings(true)
    try {
      const { error } = await supabase
        .from('announcement_bar_settings')
        .update({ ...barForm, updated_at: new Date().toISOString() })
        .eq('id', barSettings.id)

      if (error) throw error
      setBarSettings({ ...barSettings, ...barForm })
      alert('✅ Diseño guardado correctamente')
    } catch (error) {
      console.error('Error saving bar settings:', error)
      alert('❌ Error al guardar. Verificá que la tabla "announcement_bar_settings" ya exista en Supabase.')
    } finally {
      setSavingBarSettings(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="animate-pulse text-text-muted">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800 text-white sticky top-0 z-20">
        <div className="px-4 pt-safe-top">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-bold text-lg leading-tight">Edición Web</h1>
                <p className="text-sm text-white/70">Configura tu landing y catálogo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Tabs */}
      <div className="px-4 -mt-2 mb-6 sticky top-20 z-10">
        <div className="flex gap-2 p-1.5 bg-surface rounded-2xl card">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-muted'
            }`}
          >
            ⚙️ Configuración
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'sections'
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-muted'
            }`}
          >
            🧩 Secciones
          </button>
        </div>

        {/* Sub-navegación de Secciones */}
        {activeTab === 'sections' && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            {[
              { key: 'announcement', label: '📢 Barra de anuncios' },
              { key: 'header', label: '🧭 Header / Menú' },
              { key: 'hero', label: '🎨 Hero' },
              { key: 'landing', label: '📄 Bloques de Landing' },
              { key: 'popups', label: '💬 Pop-ups' },
              { key: 'footer', label: '🦶 Footer' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setSectionView(item.key as typeof sectionView)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                  sectionView === item.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-muted border-border'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 pb-6">
        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="card max-w-2xl">
            <h3 className="font-bold text-xl mb-6">Datos del Negocio</h3>

            {settingsMessage && (
              <div className={`mb-6 p-4 rounded-lg ${
                settingsMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {settingsMessage.text}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Teléfono WhatsApp * <span className="text-red-500">(obligatorio)</span></label>
                <input
                  type="tel"
                  value={settingsForm.phone_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone_number: e.target.value })}
                  placeholder="+598 99 123 4567"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Email</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  placeholder="info@losprimos.com"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Dirección</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  placeholder="Calle, número, ciudad"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Horarios</label>
                <input
                  type="text"
                  value={settingsForm.business_hours}
                  onChange={(e) => setSettingsForm({ ...settingsForm, business_hours: e.target.value })}
                  placeholder="Lunes a Viernes: 7:00 - 18:00"
                  className="input"
                />
              </div>
            </div>

            {/* Visibilidad de Datos */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-bold text-lg mb-4">¿Qué datos mostrar en el Header?</h4>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_phone || false}
                    onChange={(e) => setSettingsForm({ ...settingsForm, show_phone: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="font-semibold text-gray-700">📱 Mostrar Teléfono</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_business_hours || false}
                    onChange={(e) => setSettingsForm({ ...settingsForm, show_business_hours: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="font-semibold text-gray-700">🕐 Mostrar Horarios</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_address || false}
                    onChange={(e) => setSettingsForm({ ...settingsForm, show_address: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="font-semibold text-gray-700">📍 Mostrar Dirección</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_email || false}
                    onChange={(e) => setSettingsForm({ ...settingsForm, show_email: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="font-semibold text-gray-700">📧 Mostrar Email</span>
                </label>
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="btn btn-primary w-full mt-6"
            >
              {savingSettings ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        )}

        {/* PALETA DE COLORES GLOBAL */}
        {activeTab === 'settings' && (
          <div className="card max-w-2xl mt-6">
            <h3 className="font-bold text-xl mb-2">🎨 Paleta de Colores</h3>
            <p className="text-sm text-text-muted mb-6">
              Colores reutilizables en toda la web (barra de anuncios y futuras secciones).
            </p>

            <div className="space-y-3 mb-4">
              {palette.map((swatch, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <input
                      type="color"
                      value={swatch.hex}
                      onChange={(e) => updatePaletteColor(idx, 'hex', e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow pointer-events-none" style={{ backgroundColor: swatch.hex }} />
                  </div>
                  <input
                    type="text"
                    value={swatch.name}
                    onChange={(e) => updatePaletteColor(idx, 'name', e.target.value)}
                    className="input flex-1"
                    placeholder="Nombre del color"
                  />
                  <input
                    type="text"
                    value={swatch.hex}
                    onChange={(e) => updatePaletteColor(idx, 'hex', e.target.value)}
                    className="input !w-28 font-mono text-xs"
                  />
                  <button
                    onClick={() => removePaletteColor(idx)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addPaletteColor}
              className="text-sm font-semibold text-primary hover:underline mb-6"
            >
              + Agregar color
            </button>

            <button
              onClick={savePalette}
              disabled={savingPalette}
              className="btn btn-primary w-full"
            >
              {savingPalette ? 'Guardando...' : 'Guardar Paleta'}
            </button>
          </div>
        )}

        {/* BARRA DE ANUNCIOS */}
        {activeTab === 'sections' && sectionView === 'announcement' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-xl">Barra de Anuncios</h3>
                <p className="text-sm text-text-muted">Mensajes que aparecen arriba del header (envíos, descuentos, etc.)</p>
              </div>
              <button
                onClick={() => openAnnouncementModal()}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all whitespace-nowrap"
              >
                + Nuevo Mensaje
              </button>
            </div>

            {/* Vista previa en vivo (con el diseño aplicado) */}
            {announcements.filter(a => a.is_active).length > 0 && (() => {
              const preview = announcements.filter(a => a.is_active).sort((a, b) => a.order_position - b.order_position)[0]
              const FONT_FAMILY_MAP: Record<string, string> = {
                default: "'DM Sans', sans-serif",
                serif: "Georgia, 'Times New Roman', serif",
                mono: "'Courier New', monospace"
              }
              const LETTER_SPACING_MAP: Record<string, string> = { normal: 'normal', wide: '0.025em', wider: '0.05em' }
              const isGradient = barForm.animation === 'gradient'
              const animClass = barForm.animation !== 'none' ? `ann-preview-${barForm.animation}` : ''

              return (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-text-muted mb-2">VISTA PREVIA</p>
                  <style>{`
                    .ann-preview-pulse { animation: annPreviewPulse 2.4s ease-in-out infinite; }
                    @keyframes annPreviewPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }
                    .ann-preview-shimmer { position: relative; overflow: hidden; }
                    .ann-preview-shimmer::after {
                      content: ''; position: absolute; top: 0; left: -60%; width: 60%; height: 100%;
                      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
                      animation: annPreviewShimmer 2.8s ease-in-out infinite;
                    }
                    @keyframes annPreviewShimmer { 0% { left: -60%; } 100% { left: 130%; } }
                    .ann-preview-bounce-icon .ann-preview-icon { display: inline-block; animation: annPreviewBounce 1.2s ease-in-out infinite; }
                    @keyframes annPreviewBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
                    .ann-preview-gradient { background-size: 200% 200%; animation: annPreviewGradient 6s ease infinite; }
                    @keyframes annPreviewGradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                  `}</style>
                  <div
                    className={`rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 text-center ${animClass}`}
                    style={{
                      backgroundImage: isGradient ? `linear-gradient(270deg, ${barForm.bg_color}, ${shadeColor(barForm.bg_color, 45)}, ${barForm.bg_color})` : undefined,
                      backgroundColor: isGradient ? undefined : barForm.bg_color,
                      color: barForm.text_color,
                      fontFamily: FONT_FAMILY_MAP[barForm.font_family],
                      fontSize: barForm.font_size,
                      fontWeight: barForm.font_weight,
                      letterSpacing: LETTER_SPACING_MAP[barForm.letter_spacing]
                    }}
                  >
                    {preview.icon && <span className="ann-preview-icon">{preview.icon}</span>}
                    <span>{preview.message}</span>
                    {preview.link_text && <span className="underline font-semibold ml-1">{preview.link_text}</span>}
                  </div>
                </div>
              )
            })()}

            {/* Panel de Diseño */}
            <div className="card mb-6">
              <h4 className="font-bold text-lg mb-5">🎨 Diseño de la barra</h4>

              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <ColorPicker
                  label="Color de fondo"
                  value={barForm.bg_color}
                  onChange={(hex) => setBarForm({ ...barForm, bg_color: hex })}
                  palette={palette}
                />
                <ColorPicker
                  label="Color de texto"
                  value={barForm.text_color}
                  onChange={(hex) => setBarForm({ ...barForm, text_color: hex })}
                  palette={palette}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">Tipografía</label>
                  <select
                    value={barForm.font_family}
                    onChange={(e) => setBarForm({ ...barForm, font_family: e.target.value })}
                    className="input"
                  >
                    <option value="default">Predeterminada (DM Sans)</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Monoespaciada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">Grosor</label>
                  <select
                    value={barForm.font_weight}
                    onChange={(e) => setBarForm({ ...barForm, font_weight: e.target.value })}
                    className="input"
                  >
                    <option value="400">Normal</option>
                    <option value="500">Medio</option>
                    <option value="600">Semi-negrita</option>
                    <option value="700">Negrita</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">
                    Tamaño de letra <span className="text-text-light font-normal">({barForm.font_size})</span>
                  </label>
                  <input
                    type="range"
                    min={11}
                    max={20}
                    value={parseInt(barForm.font_size)}
                    onChange={(e) => setBarForm({ ...barForm, font_size: `${e.target.value}px` })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">Espaciado entre letras</label>
                  <select
                    value={barForm.letter_spacing}
                    onChange={(e) => setBarForm({ ...barForm, letter_spacing: e.target.value })}
                    className="input"
                  >
                    <option value="normal">Normal</option>
                    <option value="wide">Amplio</option>
                    <option value="wider">Muy amplio</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-text-muted mb-2">Efecto visual</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'none', label: 'Ninguno' },
                    { value: 'pulse', label: 'Pulso suave' },
                    { value: 'shimmer', label: 'Brillo deslizante' },
                    { value: 'bounce-icon', label: 'Ícono rebotando' },
                    { value: 'gradient', label: 'Fondo animado' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBarForm({ ...barForm, animation: opt.value })}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                        barForm.animation === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-text-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveBarSettings}
                disabled={savingBarSettings}
                className="btn btn-primary w-full"
              >
                {savingBarSettings ? 'Guardando...' : 'Guardar Diseño'}
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="card text-center py-12 text-text-muted">
                <div className="text-4xl mb-3">📢</div>
                <p className="font-medium">Todavía no hay mensajes</p>
                <p className="text-sm mt-1">Creá el primero para que aparezca arriba del header</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...announcements].sort((a, b) => a.order_position - b.order_position).map((item, idx, arr) => (
                  <div key={item.id} className={`card flex items-center gap-4 ${!item.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveAnnouncement(item.id, 'up')}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200"
                      >▲</button>
                      <button
                        onClick={() => moveAnnouncement(item.id, 'down')}
                        disabled={idx === arr.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200"
                      >▼</button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text truncate">
                        {item.icon && <span className="mr-1">{item.icon}</span>}
                        {item.message}
                      </p>
                      {item.link_text && (
                        <p className="text-xs text-primary mt-1">{item.link_text} → {item.link_url}</p>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={() => toggleAnnouncementActive(item)}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <span className="text-xs font-semibold text-text-muted hidden sm:inline">Activo</span>
                    </label>

                    <button
                      onClick={() => openAnnouncementModal(item)}
                      className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(item.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HEADER / MENÚ */}
        {activeTab === 'sections' && sectionView === 'header' && (() => {
          const sortedLinks = [...menuLinks].sort((a, b) => a.order_position - b.order_position)
          const activePreviewLinks = sortedLinks.filter(l => l.is_active)

          return (
            <div>
              <h3 className="font-bold text-xl mb-1">Header / Menú</h3>
              <p className="text-sm text-text-muted mb-6">Logo, enlaces de navegación y estilo del encabezado del sitio</p>

              {/* Vista previa en vivo */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-text-muted mb-2">VISTA PREVIA</p>
                <div
                  className={`rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between ${headerForm.shadow ? 'shadow-md' : ''}`}
                  style={{ backgroundColor: headerForm.bg_color }}
                >
                  {logoForm.use_logo_image && logoForm.logo_url ? (
                    <img src={logoForm.logo_url} alt={logoForm.site_name} className="h-8 object-contain" />
                  ) : (
                    <div>
                      <p className="font-black text-lg" style={{ color: headerForm.text_color }}>{logoForm.site_name}</p>
                      <p className="text-[10px] font-semibold" style={{ color: headerForm.text_color, opacity: 0.7 }}>{logoForm.site_tagline}</p>
                    </div>
                  )}
                  <div className="hidden sm:flex gap-5">
                    {activePreviewLinks.map((link, idx) => (
                      <span key={link.id} className="font-semibold text-sm" style={{ color: idx === 0 ? headerForm.active_color : headerForm.text_color }}>
                        {link.label}
                      </span>
                    ))}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-xs">ℹ️</div>
                </div>
              </div>

              {/* LOGO Y NOMBRE */}
              <div className="card mb-6">
                <h4 className="font-bold text-lg mb-5">🖼️ Logo y Nombre</h4>

                <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
                  <button
                    onClick={() => setLogoForm({ ...logoForm, use_logo_image: false })}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!logoForm.use_logo_image ? 'bg-white shadow text-text' : 'text-text-muted'}`}
                  >
                    Texto
                  </button>
                  <button
                    onClick={() => setLogoForm({ ...logoForm, use_logo_image: true })}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${logoForm.use_logo_image ? 'bg-white shadow text-text' : 'text-text-muted'}`}
                  >
                    Imagen
                  </button>
                </div>

                {logoForm.use_logo_image ? (
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-text-muted mb-2">Logo (imagen)</label>
                    {logoForm.logo_url && (
                      <div className="mb-3 p-4 bg-gray-50 rounded-lg inline-block">
                        <img src={logoForm.logo_url} alt="Logo" className="h-12 object-contain" />
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="input" />
                    {uploadingLogo && <p className="text-xs text-text-muted mt-2">Subiendo...</p>}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2">Nombre del sitio</label>
                      <input
                        type="text"
                        value={logoForm.site_name}
                        onChange={(e) => setLogoForm({ ...logoForm, site_name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2">Tagline</label>
                      <input
                        type="text"
                        value={logoForm.site_tagline}
                        onChange={(e) => setLogoForm({ ...logoForm, site_tagline: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                )}

                <button onClick={saveLogo} disabled={savingLogo} className="btn btn-primary w-full">
                  {savingLogo ? 'Guardando...' : 'Guardar Logo y Nombre'}
                </button>
              </div>

              {/* ENLACES DE MENÚ */}
              <div className="card mb-6">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="font-bold text-lg">🔗 Enlaces de Menú</h4>
                  <button
                    onClick={() => openMenuLinkModal()}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 text-sm whitespace-nowrap"
                  >
                    + Nuevo Enlace
                  </button>
                </div>

                {sortedLinks.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6">Todavía no hay enlaces configurados</p>
                ) : (
                  <div className="space-y-3">
                    {sortedLinks.map((link, idx) => (
                      <div key={link.id} className={`flex items-center gap-3 p-3 rounded-lg border border-border ${!link.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveMenuLink(link.id, 'up')} disabled={idx === 0} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200">▲</button>
                          <button onClick={() => moveMenuLink(link.id, 'down')} disabled={idx === sortedLinks.length - 1} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200">▼</button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-text truncate">{link.label}</p>
                          <p className="text-xs text-text-muted truncate">{link.url}</p>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={link.is_active} onChange={() => toggleMenuLinkActive(link)} className="w-5 h-5 rounded border-gray-300" />
                        </label>

                        <button onClick={() => openMenuLinkModal(link)} className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 text-sm">Editar</button>
                        <button onClick={() => deleteMenuLink(link.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 text-sm">Eliminar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ESTILO */}
              <div className="card mb-6">
                <h4 className="font-bold text-lg mb-5">🎨 Estilo del Header</h4>

                <div className="grid sm:grid-cols-3 gap-5 mb-5">
                  <ColorPicker label="Color de fondo" value={headerForm.bg_color} onChange={(hex) => setHeaderForm({ ...headerForm, bg_color: hex })} palette={palette} />
                  <ColorPicker label="Color de texto" value={headerForm.text_color} onChange={(hex) => setHeaderForm({ ...headerForm, text_color: hex })} palette={palette} />
                  <ColorPicker label="Color de enlace activo" value={headerForm.active_color} onChange={(hex) => setHeaderForm({ ...headerForm, active_color: hex })} palette={palette} />
                </div>

                <div className="flex flex-wrap gap-6 mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={headerForm.sticky} onChange={(e) => setHeaderForm({ ...headerForm, sticky: e.target.checked })} className="w-5 h-5 rounded border-gray-300" />
                    <span className="font-semibold text-sm">Header fijo al hacer scroll (sticky)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={headerForm.shadow} onChange={(e) => setHeaderForm({ ...headerForm, shadow: e.target.checked })} className="w-5 h-5 rounded border-gray-300" />
                    <span className="font-semibold text-sm">Sombra debajo del header</span>
                  </label>
                </div>

                <button onClick={saveHeaderSettings} disabled={savingHeaderSettings} className="btn btn-primary w-full">
                  {savingHeaderSettings ? 'Guardando...' : 'Guardar Estilo'}
                </button>
              </div>
            </div>
          )
        })()}
        {activeTab === 'sections' && sectionView === 'hero' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Hero Slider</h3>
              <button
                onClick={() => openHeroModal()}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all"
              >
                + Nuevo Slide
              </button>
            </div>

            <div className="space-y-4">
              {heroSlides.map((hero, idx) => (
                <div key={hero.id} className="card">
                  <div className="flex gap-4">
                    {hero.image_url && (
                      <img
                        src={hero.image_url}
                        alt={hero.title}
                        className="w-24 h-24 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="12" fill="%23999" text-anchor="middle" dominant-baseline="central"%3EError%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-text">{hero.title}</h4>
                      <p className="text-sm text-text-muted line-clamp-2">{hero.description}</p>
                      <p className="text-xs text-primary mt-2">{hero.cta_text}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openHeroModal(hero)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteHeroSlide(hero.id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOQUES DE LANDING */}
        {activeTab === 'sections' && sectionView === 'landing' && (
          <div>
            <h3 className="font-bold text-xl mb-6">Bloques de Landing</h3>

            <div className="space-y-4">
              {sections.map(section => (
                <div key={section.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-text">{section.section_name}</h4>
                      <p className="text-sm text-text-muted">{section.title}</p>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{section.description}</p>
                    </div>
                    <button
                      onClick={() => openSectionModal(section)}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POP-UPS (próximamente) */}
        {activeTab === 'sections' && sectionView === 'popups' && (
          <div className="card text-center py-16 text-text-muted">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-semibold text-text">Pop-ups</p>
            <p className="text-sm mt-1">Próximamente vas a poder crear pop-ups (newsletter, promociones, etc.) desde acá</p>
          </div>
        )}

        {/* FOOTER (próximamente) */}
        {activeTab === 'sections' && sectionView === 'footer' && (
          <div className="card text-center py-16 text-text-muted">
            <div className="text-4xl mb-3">🦶</div>
            <p className="font-semibold text-text">Footer</p>
            <p className="text-sm mt-1">Próximamente vas a poder editar el pie de página desde acá</p>
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Hero Modal */}
      {showHeroModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowHeroModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">{editingHero ? 'Editar Slide' : 'Nuevo Slide'}</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Imagen * (Sube desde tu ordenador)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-all"
                >
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full max-h-48 object-cover rounded-lg mx-auto"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E'
                        }}
                      />
                      <button 
                        type="button"
                        className="text-sm text-primary font-semibold"
                      >
                        Cambiar imagen
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📸</div>
                      <div className="text-sm font-semibold text-text">Haz clic para subir una imagen</div>
                      <div className="text-xs text-text-muted">JPG, PNG, WebP (máx 5MB)</div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Título *</label>
                <input
                  type="text"
                  value={heroForm.title}
                  onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                  className="input"
                  placeholder="Ej: Los mejores productos"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Descripción</label>
                <textarea
                  value={heroForm.description}
                  onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                  className="input min-h-24"
                  placeholder="Describe el contenido del slide"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Botón - Texto</label>
                <input
                  type="text"
                  value={heroForm.cta_text}
                  onChange={(e) => setHeroForm({ ...heroForm, cta_text: e.target.value })}
                  placeholder="Ver Catálogo"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Botón - URL</label>
                <input
                  type="text"
                  value={heroForm.cta_url}
                  onChange={(e) => setHeroForm({ ...heroForm, cta_url: e.target.value })}
                  placeholder="/catalogo"
                  className="input"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowHeroModal(false)} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button 
                onClick={saveHeroSlide} 
                disabled={savingHero || uploadingImage} 
                className="btn btn-primary flex-1"
              >
                {savingHero ? 'Guardando...' : uploadingImage ? 'Subiendo...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowSectionModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">Editar Sección</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Título *</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Subtítulo</label>
                <input
                  type="text"
                  value={sectionForm.subtitle}
                  onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Descripción</label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="input min-h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">URL Imagen</label>
                <input
                  type="url"
                  value={sectionForm.image_url}
                  onChange={(e) => setSectionForm({ ...sectionForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="input"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowSectionModal(false)} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button onClick={saveSection} disabled={savingSection} className="btn btn-primary flex-1">
                {savingSection ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Link Modal */}
      {showMenuLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowMenuLinkModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">{editingMenuLink ? 'Editar Enlace' : 'Nuevo Enlace'}</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Texto *</label>
                <input
                  type="text"
                  value={menuLinkForm.label}
                  onChange={(e) => setMenuLinkForm({ ...menuLinkForm, label: e.target.value })}
                  placeholder="Ej: Ofertas"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">URL *</label>
                <input
                  type="text"
                  value={menuLinkForm.url}
                  onChange={(e) => setMenuLinkForm({ ...menuLinkForm, url: e.target.value })}
                  placeholder="/descuentos"
                  className="input"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={menuLinkForm.is_active}
                  onChange={(e) => setMenuLinkForm({ ...menuLinkForm, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="font-semibold text-gray-700">Enlace activo</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowMenuLinkModal(false)} className="btn btn-outline flex-1">Cancelar</button>
              <button onClick={saveMenuLink} disabled={savingMenuLink} className="btn btn-primary flex-1">
                {savingMenuLink ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowAnnouncementModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">{editingAnnouncement ? 'Editar Mensaje' : 'Nuevo Mensaje'}</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Mensaje *</label>
                <input
                  type="text"
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  placeholder="Ej: Envío gratis en compras mayores a $2000"
                  className="input"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Icono (emoji, opcional)</label>
                <input
                  type="text"
                  value={announcementForm.icon}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, icon: e.target.value })}
                  placeholder="🚚"
                  className="input"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Texto del botón (opcional)</label>
                <input
                  type="text"
                  value={announcementForm.link_text}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, link_text: e.target.value })}
                  placeholder="Ver más"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">URL del botón (opcional)</label>
                <input
                  type="text"
                  value={announcementForm.link_url}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, link_url: e.target.value })}
                  placeholder="/catalogo"
                  className="input"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementForm.is_active}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="font-semibold text-gray-700">Mensaje activo</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAnnouncementModal(false)} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button onClick={saveAnnouncement} disabled={savingAnnouncement} className="btn btn-primary flex-1">
                {savingAnnouncement ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
