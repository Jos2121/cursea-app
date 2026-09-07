import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoEditorPreview } from '@/components/VideoEditorPreview';
import { TemplateConfig } from './Dashboard'; // we might need to copy/adjust this import

const DEFAULT_CONFIG: TemplateConfig = {
  photo: { x: 120, y: 350, w: 840, h: 840 },
  titulo: { x: 100, y: 1300, fontSize: 64, color: '#ffffff', align: 'center' },
  artista: { x: 100, y: 1400, fontSize: 42, color: '#e5e7eb', align: 'center' },
  dedicatoria: { x: 100, y: 1550, fontSize: 36, color: '#f3f4f6', align: 'center' }
};

export default function Landing() {
  const [templates, setTemplates] = useState<{id: string, name: string, backgroundUrl: string, config: TemplateConfig}[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [config, setConfig] = useState<TemplateConfig>(DEFAULT_CONFIG);
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  
  const [userPhotoUrl, setUserPhotoUrl] = useState<string>('');
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [dedicatoria, setDedicatoria] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [previewScale, setPreviewScale] = useState(0.5);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Resize observer to maintain preview scale
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        // Base width for calculations is 1080
        const containerWidth = previewContainerRef.current.clientWidth;
        const newScale = containerWidth / 1080;
        setPreviewScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setTemplates(data);
          if (data.length > 0) {
            setSelectedTemplateId(data[0].id);
          }
        }
      })
      .catch(err => {
        console.error("Error fetching templates:", err);
        toast.error("No se pudieron cargar las plantillas.");
      });
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setBackgroundUrl(template.backgroundUrl);
        if (template.config) {
          setConfig(template.config);
        }
      }
    }
  }, [selectedTemplateId, templates]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      toast.error('La imagen no puede pesar más de 6MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/public/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.statusMessage || 'Error subiendo archivo');
      }

      setUserPhotoUrl(data.url);
      toast.success('Foto de portada subida correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Hubo un error al subir la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = () => {
    setUserPhotoUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplateId || !userPhotoUrl || !titulo || !artista || !whatsappNumber) {
      toast.error('Por favor, completa todos los campos requeridos (incluyendo la foto de portada).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/public/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundUrl,
          userPhotoUrl,
          titulo,
          artista,
          dedicatoria,
          whatsappNumber,
          config
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.statusMessage || 'Error al registrar petición');
      }

      // Redirigir a WhatsApp
      const paymentNumber = import.meta.env.VITE_WHATSAPP_PAYMENT_NUMBER || whatsappNumber.replace(/[^0-9]/g, '');
      const text = encodeURIComponent('Hola he llenado los campos requeridos para obtener mi canción personalizada, quisiera realizar el pago');
      window.location.href = `https://wa.me/${paymentNumber}?text=${text}`;
      
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar tu solicitud. Intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* FORM COLUMN */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Crea tu canción</h1>
            <p className="text-gray-500">Personaliza tu regalo y obtén una vista previa al instante.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex-1">
            
            <div className="space-y-3">
              <Label htmlFor="template">Plantilla de Fondo <span className="text-red-500">*</span></Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="template" className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                  {templates.length === 0 && (
                    <SelectItem value="none" disabled>No hay plantillas disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Foto de Portada <span className="text-red-500">*</span></Label>
              
              {!userPhotoUrl ? (
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isUploading ? 'bg-gray-50 border-gray-300' : 'hover:bg-gray-50 border-gray-200 cursor-pointer'
                  }`}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <span className="text-sm">Subiendo foto...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <UploadCloud className="h-8 w-8 mb-2 text-gray-400" />
                      <span className="text-sm font-medium">Toca para seleccionar</span>
                      <span className="text-xs text-gray-400 mt-1">Máximo 6MB (JPG, PNG)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative inline-block">
                  <img src={userPhotoUrl} alt="Portada" className="h-32 w-32 object-cover rounded-xl shadow-sm border border-gray-200" />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="titulo">Título de la Canción <span className="text-red-500">*</span></Label>
              <Input 
                id="titulo" 
                value={titulo} 
                onChange={e => setTitulo(e.target.value)} 
                placeholder="Ej. Nuestra Historia"
                className="rounded-xl border-gray-200"
                maxLength={40}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="artista">Artista <span className="text-red-500">*</span></Label>
              <Input 
                id="artista" 
                value={artista} 
                onChange={e => setArtista(e.target.value)} 
                placeholder="Ej. Juan y María"
                className="rounded-xl border-gray-200"
                maxLength={30}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="dedicatoria">Mensaje Corto / Dedicatoria</Label>
              <Textarea 
                id="dedicatoria" 
                value={dedicatoria} 
                onChange={e => setDedicatoria(e.target.value)} 
                placeholder="Un pequeño mensaje de amor..."
                className="rounded-xl border-gray-200 resize-none min-h-[100px]"
                maxLength={80}
              />
              <div className="text-xs text-right text-gray-400">
                {dedicatoria.length}/80
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="whatsapp">Número de WhatsApp (con prefijo) <span className="text-red-500">*</span></Label>
              <Input 
                id="whatsapp" 
                value={whatsappNumber} 
                onChange={e => setWhatsappNumber(e.target.value)} 
                placeholder="Ej. +34612345678"
                className="rounded-xl border-gray-200"
                type="tel"
              />
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full rounded-xl py-6 text-base font-semibold shadow-sm bg-black hover:bg-gray-800 transition-all"
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Registrar petición"
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* PREVIEW COLUMN */}
        <div className="flex flex-col items-center justify-start lg:sticky lg:top-10 h-max">
          <div className="bg-gray-100 rounded-3xl p-6 shadow-inner w-full max-w-sm flex items-center justify-center">
             <div ref={previewContainerRef} className="w-full">
                <VideoEditorPreview
                  config={config}
                  onUpdateConfig={() => {}} // Read-only for landing
                  backgroundUrl={backgroundUrl}
                  customBackground=""
                  userPhotoUrl={userPhotoUrl}
                  titulo={titulo}
                  artista={artista}
                  dedicatoria={dedicatoria}
                  scale={previewScale}
                />
             </div>
          </div>
          <p className="text-sm text-gray-400 mt-6 text-center max-w-xs">
            Esta es una vista previa de cómo quedará el diseño final en tu celular.
          </p>
        </div>
      </div>

    </div>
  );
}
