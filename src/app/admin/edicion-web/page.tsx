'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { uploadImageToSupabase } from '@/lib/image-upload-helper'
import type { Employee } from '@/types/database'

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

export default function WebsiteEditionPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'settings' | 'hero' | 'sections'>('settings')

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
      const [settingsRes, heroRes, sectionsRes] = await Promise.all([
        supabase.from('website_settings').select('*').single(),
        supabase.from('hero_slides').select('*').order('order_position'),
        supabase.from('landing_sections').select('*').order('section_name')
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
      }

      if (heroRes.data) setHeroSlides(heroRes.data as HeroSlide[])
      if (sectionsRes.data) setSections(sectionsRes.data as LandingSection[])
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
            onClick={() => setActiveTab('hero')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'hero'
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-muted'
            }`}
          >
            🎨 Hero
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'sections'
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-muted'
            }`}
          >
            📄 Secciones
          </button>
        </div>
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

        {/* HERO TAB */}
        {activeTab === 'hero' && (
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

        {/* SECTIONS TAB */}
        {activeTab === 'sections' && (
          <div>
            <h3 className="font-bold text-xl mb-6">Secciones de Landing</h3>

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
    </div>
  )
}
