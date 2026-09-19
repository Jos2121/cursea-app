import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Layout, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoEditorPreview } from '@/components/VideoEditorPreview';
import { DEFAULT_TEMPLATE, TemplateConfig } from './Dashboard';

export default function TemplateManager() {
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<TemplateConfig & { name?: string, type?: 'completa' | 'coordenadas' }>({ ...DEFAULT_TEMPLATE, id: '' });
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [customBackground, setCustomBackground] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'completa' | 'coordenadas'>('completa');
  const [scale, setScale] = useState(0.4);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        setDbTemplates(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSelectTemplate = (t: any) => {
    const config = typeof t.config === 'string' ? JSON.parse(t.config) : t.config;
    setActiveTemplate({
      ...DEFAULT_TEMPLATE,
      ...config,
      id: t.id,
      name: t.name
    });
    setTemplateName(t.name || '');
    setTemplateType(config?.type === 'coordenadas' ? 'coordenadas' : 'completa');
    
    // Set background handling both top-level and config-level bgUrl/backgroundUrl
    const rawBgUrl = t.bgUrl || config?.backgroundUrl || config?.bgUrl || '';
    if (rawBgUrl && !['image_f840ac.jpg', 'image_81efaf.jpg', 'image_210d19.jpg', 'image_6c0245.jpg', 'image_82a3ee.jpg'].includes(rawBgUrl)) {
      setBackgroundUrl('custom');
      setCustomBackground(rawBgUrl);
    } else {
      setBackgroundUrl(rawBgUrl);
      setCustomBackground('');
    }
  };

  const handleNewTemplate = () => {
    setActiveTemplate({ ...DEFAULT_TEMPLATE, id: '' });
    setTemplateName('');
    setBackgroundUrl('');
    setCustomBackground('');
  };

  const handleSaveTemplate = async () => {
    if (!templateName) return toast.error('El nombre es obligatorio');
    
    try {
      const finalBgUrl = backgroundUrl === 'custom' ? customBackground : backgroundUrl;
      const payloadConfig = {
        type: templateType,
        photoX: Number(activeTemplate.photo.x),
        photoY: Number(activeTemplate.photo.y),
        photoWidth: Number(activeTemplate.photo.w),
        photoHeight: Number(activeTemplate.photo.h),
        tituloX: Number(activeTemplate.titulo.x),
        tituloY: Number(activeTemplate.titulo.y),
        tituloSize: Number(activeTemplate.titulo.fontSize),
        artistaX: Number(activeTemplate.artista.x),
        artistaY: Number(activeTemplate.artista.y),
        artistaSize: Number(activeTemplate.artista.fontSize),
        dedicatoriaX: Number(activeTemplate.dedicatoria.x),
        dedicatoriaY: Number(activeTemplate.dedicatoria.y),
        dedicatoriaSize: Number(activeTemplate.dedicatoria.fontSize),
        ...(templateType === 'completa' ? { backgroundUrl: finalBgUrl, bgUrl: finalBgUrl } : {}),
        photo: { ...activeTemplate.photo },
        titulo: { ...activeTemplate.titulo },
        artista: { ...activeTemplate.artista },
        dedicatoria: { ...activeTemplate.dedicatoria }
      };

      const res = await fetch('/api/templates/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          id: activeTemplate.id || undefined,
          name: templateName,
          config: payloadConfig
        })
      });
      
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Plantilla guardada exitosamente');
        handleNewTemplate();
        loadTemplates();
      } else {
        toast.error(`Error al guardar: ${data.statusMessage || data.message || 'Error desconocido'}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Error: ${e.message}`);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!templateId) return;
    if (!confirm('¿Seguro que deseas eliminar esta plantilla?')) return;
    
    try {
      const res = await fetch('/api/templates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId })
      });

      if (!res.ok) throw new Error("Error al eliminar");
      
      setDbTemplates(prev => prev.filter(t => t.id !== templateId));
      if (activeTemplate.id === templateId) {
        handleNewTemplate();
      }
      toast.success("Plantilla eliminada.");
    } catch (error: any) {
      toast.error(`Error al eliminar: ${error.message}`);
    }
  };

  const renderControl = (label: string, value: number | string, onChange: (v: any) => void, type: 'number' | 'text' = 'number') => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="h-8 text-xs"
      />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8">
      {/* Sidebar: List of templates */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-serif flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#8B1F32]" />
            Plantillas
          </h2>
          <Button onClick={handleNewTemplate} size="sm" variant="outline" className="h-8">
            <Plus className="w-4 h-4 mr-1" /> Nueva
          </Button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-150px)] pr-2">
          {dbTemplates.map(t => (
            <div 
              key={t.id} 
              onClick={() => handleSelectTemplate(t)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTemplate.id === t.id 
                  ? 'border-[#8B1F32] bg-[#8B1F32]/5' 
                  : 'border-neutral-200 bg-white hover:border-[#8B1F32]/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-sm">{t.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t.config?.type === 'coordenadas' ? 'Solo Posiciones' : 'Completa (Fondo + Posiciones)'}
                  </p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50"
                  onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {dbTemplates.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500 border border-dashed rounded-xl bg-white/50">
              No hay plantillas guardadas
            </div>
          )}
        </div>
      </div>

      {/* Main content: Editor */}
      <div className="flex-1 bg-white rounded-3xl border border-[#8B1F32]/10 shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-neutral-900">
              {activeTemplate.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h2>
            <p className="text-sm text-neutral-500">Ajusta las coordenadas y propiedades visuales</p>
          </div>
          <Button onClick={handleSaveTemplate} className="bg-[#8B1F32] hover:bg-[#731929] text-white">
            <Save className="w-4 h-4 mr-2" /> Guardar Plantilla
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Controls */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-neutral-100 space-y-8">
            {/* General */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Configuración General
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de Plantilla</Label>
                  <Input 
                    value={templateName} 
                    onChange={e => setTemplateName(e.target.value)} 
                    placeholder="Ej. Plantilla Romántica" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={templateType} onValueChange={(v: 'completa'|'coordenadas') => setTemplateType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completa">Completa (Fondo + Posiciones)</SelectItem>
                      <SelectItem value="coordenadas">Solo Coordenadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {templateType === 'completa' && (
                <div className="space-y-2">
                  <Label>Fondo</Label>
                  <Select value={backgroundUrl} onValueChange={setBackgroundUrl}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar fondo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image_f840ac.jpg">Gradient Mágico</SelectItem>
                      <SelectItem value="image_81efaf.jpg">Vinilo Retro</SelectItem>
                      <SelectItem value="image_210d19.jpg">Romántico</SelectItem>
                      <SelectItem value="image_6c0245.jpg">Polaroid</SelectItem>
                      <SelectItem value="image_82a3ee.jpg">Neon Night</SelectItem>
                      <SelectItem value="custom">URL Personalizada...</SelectItem>
                    </SelectContent>
                  </Select>
                  {backgroundUrl === 'custom' && (
                    <Input 
                      placeholder="https://..." 
                      value={customBackground}
                      onChange={e => setCustomBackground(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Photo Coords */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Foto</h3>
                <div className="grid grid-cols-2 gap-2">
                  {renderControl('X', activeTemplate.photo.x, v => setActiveTemplate(p => ({...p, photo: {...p.photo, x: v}})))}
                  {renderControl('Y', activeTemplate.photo.y, v => setActiveTemplate(p => ({...p, photo: {...p.photo, y: v}})))}
                  {renderControl('Ancho', activeTemplate.photo.w, v => setActiveTemplate(p => ({...p, photo: {...p.photo, w: v}})))}
                  {renderControl('Alto', activeTemplate.photo.h, v => setActiveTemplate(p => ({...p, photo: {...p.photo, h: v}})))}
                </div>
              </div>

              {/* Titulo Coords */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Título</h3>
                <div className="grid grid-cols-2 gap-2">
                  {renderControl('X (o center)', activeTemplate.titulo.x, v => setActiveTemplate(p => ({...p, titulo: {...p.titulo, x: v}})), 'text')}
                  {renderControl('Y', activeTemplate.titulo.y, v => setActiveTemplate(p => ({...p, titulo: {...p.titulo, y: v}})))}
                  {renderControl('Tamaño', activeTemplate.titulo.fontSize, v => setActiveTemplate(p => ({...p, titulo: {...p.titulo, fontSize: v}})))}
                  {renderControl('Color', activeTemplate.titulo.color, v => setActiveTemplate(p => ({...p, titulo: {...p.titulo, color: v}})), 'text')}
                </div>
              </div>

              {/* Artista Coords */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Artista</h3>
                <div className="grid grid-cols-2 gap-2">
                  {renderControl('X (o center)', activeTemplate.artista.x, v => setActiveTemplate(p => ({...p, artista: {...p.artista, x: v}})), 'text')}
                  {renderControl('Y', activeTemplate.artista.y, v => setActiveTemplate(p => ({...p, artista: {...p.artista, y: v}})))}
                  {renderControl('Tamaño', activeTemplate.artista.fontSize, v => setActiveTemplate(p => ({...p, artista: {...p.artista, fontSize: v}})))}
                  {renderControl('Color', activeTemplate.artista.color, v => setActiveTemplate(p => ({...p, artista: {...p.artista, color: v}})), 'text')}
                </div>
              </div>

              {/* Dedicatoria Coords */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Dedicatoria</h3>
                <div className="grid grid-cols-2 gap-2">
                  {renderControl('X (o center)', activeTemplate.dedicatoria.x, v => setActiveTemplate(p => ({...p, dedicatoria: {...p.dedicatoria, x: v}})), 'text')}
                  {renderControl('Y', activeTemplate.dedicatoria.y, v => setActiveTemplate(p => ({...p, dedicatoria: {...p.dedicatoria, y: v}})))}
                  {renderControl('Tamaño', activeTemplate.dedicatoria.fontSize, v => setActiveTemplate(p => ({...p, dedicatoria: {...p.dedicatoria, fontSize: v}})))}
                  {renderControl('Color', activeTemplate.dedicatoria.color, v => setActiveTemplate(p => ({...p, dedicatoria: {...p.dedicatoria, color: v}})), 'text')}
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="w-1/2 p-6 flex flex-col items-center justify-center bg-neutral-50/50">
            <div className="rounded-[32px] overflow-hidden bg-neutral-950 shadow-2xl relative border-8 border-neutral-900">
              <VideoEditorPreview
                config={activeTemplate}
                onUpdateConfig={setActiveTemplate}
                backgroundUrl={templateType === 'completa' ? backgroundUrl : ''}
                customBackground={customBackground}
                userPhotoUrl=""
                titulo="Mi Canción"
                artista="Artista"
                dedicatoria="Con mucho cariño"
                scale={scale}
              />
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">Zoom:</span>
              <input 
                type="range" 
                min="0.2" 
                max="0.8" 
                step="0.05"
                value={scale} 
                onChange={e => setScale(parseFloat(e.target.value))}
                className="w-32 accent-[#8B1F32]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
