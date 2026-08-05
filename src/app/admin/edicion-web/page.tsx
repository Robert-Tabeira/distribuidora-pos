'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types/database'

interface WebsiteSettings {
  id: string
  phone_number: string | null
  email: string | null
  address: string | null
  business_hours: string | null
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
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'settings' | 'hero' | 'sections'>('settings')

  // Settings
  const [settings, setSettings] = useState<WebsiteSettings | null>(null)
  const [settingsForm, setSettingsForm] = useState({ phone_number: '', email: '', address: '', business_hours: '' })
  const [savingSettings, setSavingSettings] = useState(false)

  // Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [editingHero, setEditingHero] = useState<HeroSlide | null>(null)
  const [heroForm, setHeroForm] = useState({ title: '', description: '', cta_text: '', cta_url: '', image_url: '' })
  const [savingHero, setSavingHero] = useState(false)
  const [showHeroModal, setShowHeroModal] = useState(false)

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
          business_hours: settingsRes.data.business_hours || ''
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
    if (!settingsForm.phone_number.trim()) {
      alert('El teléfono es requerido')
      return
    }

    setSavingSettings(true)
    try {
      if (settings) {
        const { error } = await supabase
          .from('website_settings')
          .update({
            phone_number: settingsForm.phone_number.trim(),
            email: settingsForm.email.trim() || null,
            address: settingsForm.address.trim() || null,
            business_hours: settingsForm.business_hours.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id)

        if (error) throw error

        setSettings({
          ...settings,
          phone_number: settingsForm.phone_number.trim(),
          email: settingsForm.email.trim() || null,
          address: settingsForm.address.trim() || null,
          business_hours: settingsForm.business_hours.trim() || null
        })
      } else {
        const { data, error } = await supabase
          .from('website_settings')
          .insert([{
            phone_number: settingsForm.phone_number.trim(),
            email: settingsForm.email.trim() || null,
            address: settingsForm.address.trim() || null,
            business_hours: settingsForm.business_hours.trim() || null
          }])
          .select()

        if (error) throw error
        if (data) setSettings(data[0] as WebsiteSettings)
      }

      alert('✅ Configuración guardada')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error al guardar')
    } finally {
      setSavingSettings(false)
    }
  }

  // ===== HERO SLIDES =====
  async function saveHeroSlide() {
    if (!heroForm.title.trim() || !heroForm.image_url.trim()) {
      alert('Título e imagen son requeridos')
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
      alert('✅ Slide guardado')
    } catch (error) {
      console.error('Error saving hero:', error)
      alert('Error al guardar')
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
    } else {
      setEditingHero(null)
      setHeroForm({ title: '', description: '', cta_text: '', cta_url: '', image_url: '' })
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

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Teléfono WhatsApp *</label>
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

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="btn btn-primary w-full"
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
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-text">{hero.title}</h4>
                      <p className="text-sm text-text-muted">{hero.description}</p>
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
                        className="px-4 py-2 bg-danger/10 text-danger rounded-lg font-semibold hover:bg-danger/20"
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
                      <p className="text-xs text-gray-600 mt-2">{section.description}</p>
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
                <label className="block text-sm font-semibold text-text-muted mb-2">Título *</label>
                <input
                  type="text"
                  value={heroForm.title}
                  onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">URL Imagen *</label>
                <input
                  type="url"
                  value={heroForm.image_url}
                  onChange={(e) => setHeroForm({ ...heroForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Descripción</label>
                <textarea
                  value={heroForm.description}
                  onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                  className="input min-h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">CTA Texto</label>
                <input
                  type="text"
                  value={heroForm.cta_text}
                  onChange={(e) => setHeroForm({ ...heroForm, cta_text: e.target.value })}
                  placeholder="Ver Catálogo"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">CTA URL</label>
                <input
                  type="url"
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
              <button onClick={saveHeroSlide} disabled={savingHero} className="btn btn-primary flex-1">
                {savingHero ? 'Guardando...' : 'Guardar'}
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
