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
import { TemplateConfig } from './Dashboard';

const DEFAULT_CONFIG: TemplateConfig = {
  photo: { x: 120, y: 350, w: 840, h: 840 },
  titulo: { x: 100, y: 1300, fontSize: 64, color: '#ffffff', align: 'center' },
  artista: { x: 100, y: 1400, fontSize: 42, color: '#e5e7eb', align: 'center' },
  dedicatoria: { x: 100, y: 1550, fontSize: 36, color: '#f3f4f6', align: 'center' }
};

export default function Landing() {
  const [templates, setTemplates] = useState<{id: string, name: string, backgroundUrl: string, config: TemplateConfig}[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [baseConfig, setBaseConfig] = useState<TemplateConfig>(DEFAULT_CONFIG);
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  
  // Coordinate & Size states
  const [photoX, setPhotoX] = useState<number>(130);
  const [photoY, setPhotoY] = useState<number>(180);
  const [photoWidth, setPhotoWidth] = useState<number>(820);
  const [photoHeight, setPhotoHeight] = useState<number>(820);
  
  const [tituloX, setTituloX] = useState<number | string>(130);
  const [tituloY, setTituloY] = useState<number>(1040);
  const [tituloSize, setTituloSize] = useState<number>(42);
  
  const [artistaX, setArtistaX] = useState<number | string>(130);
  const [artistaY, setArtistaY] = useState<number>(1095);
  const [artistaSize, setArtistaSize] = useState<number>(30);
  
  const [dedicatoriaX, setDedicatoriaX] = useState<number | string>(540);
  const [dedicatoriaY, setDedicatoriaY] = useState<number>(1620);
  const [dedicatoriaSize, setDedicatoriaSize] = useState<number>(28);

  // User input states
  const [userPhotoUrl, setUserPhotoUrl] = useState<string>('');
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [dedicatoria, setDedicatoria] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  // Questionnaire fields
  const [paraQuien, setParaQuien] = useState('');
  const [paraQuienOtro, setParaQuienOtro] = useState('');
  const [ocasion, setOcasion] = useState('');
  const [ocasionOtro, setOcasionOtro] = useState('');
  const [estiloMusical, setEstiloMusical] = useState('');
  const [estiloMusicalOtro, setEstiloMusicalOtro] = useState('');
  const [tipoVoz, setTipoVoz] = useState('');
  const [tono, setTono] = useState('');
  const [nombreDedicado, setNombreDedicado] = useState('');
  const [historia, setHistoria] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Computed config for the preview & payload
  const constructedConfig: any = {
    photoX: Number(photoX),
    photoY: Number(photoY),
    photoWidth: Number(photoWidth),
    photoHeight: Number(photoHeight),
    tituloX: tituloX,
    tituloY: Number(tituloY),
    tituloSize: Number(tituloSize),
    artistaX: artistaX,
    artistaY: Number(artistaY),
    artistaSize: Number(artistaSize),
    dedicatoriaX: dedicatoriaX,
    dedicatoriaY: Number(dedicatoriaY),
    dedicatoriaSize: Number(dedicatoriaSize),
    photo: { x: Number(photoX), y: Number(photoY), w: Number(photoWidth), h: Number(photoHeight) },
    titulo: { ...baseConfig.titulo, x: tituloX, y: Number(tituloY), fontSize: Number(tituloSize) },
    artista: { ...baseConfig.artista, x: artistaX, y: Number(artistaY), fontSize: Number(artistaSize) },
    dedicatoria: { ...baseConfig.dedicatoria, x: dedicatoriaX, y: Number(dedicatoriaY), fontSize: Number(dedicatoriaSize) }
  };

  // Resize observer to maintain preview scale
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
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

  const handleTemplateChange = (val: string) => {
    setSelectedTemplateId(val);
    // Asegurar coincidencia de ID convirtiendo ambos a String
    const t = templates.find(temp => String(temp.id) === String(val));
    
    if (t && t.config) {
      try {
        // Si el config viene como string (doble stringify en DB), lo parseamos
        const config = typeof t.config === 'string' ? JSON.parse(t.config) : t.config;

        if (config.backgroundUrl) setBackgroundUrl(String(config.backgroundUrl));
        
        // Coordenadas Foto
        if (config.photoX !== undefined) setPhotoX(Number(config.photoX));
        if (config.photoY !== undefined) setPhotoY(Number(config.photoY));
        if (config.photoWidth !== undefined) setPhotoWidth(Number(config.photoWidth));
        if (config.photoHeight !== undefined) setPhotoHeight(Number(config.photoHeight));

        // Título
        if (config.tituloX !== undefined) setTituloX(Number(config.tituloX));
        if (config.tituloY !== undefined) setTituloY(Number(config.tituloY));
        if (config.tituloSize !== undefined) setTituloSize(Number(config.tituloSize));

        // Artista
        if (config.artistaX !== undefined) setArtistaX(Number(config.artistaX));
        if (config.artistaY !== undefined) setArtistaY(Number(config.artistaY));
        if (config.artistaSize !== undefined) setArtistaSize(Number(config.artistaSize));

        // Dedicatoria (soportando alias)
        const dX = config.dedicatoriaX ?? config.dedicatoryX;
        const dY = config.dedicatoriaY ?? config.dedicatoryY;
        const dSize = config.dedicatoriaSize ?? config.dedicatorySize;
        
        if (dX !== undefined) setDedicatoriaX(Number(dX));
        if (dY !== undefined) setDedicatoriaY(Number(dY));
        if (dSize !== undefined) setDedicatoriaSize(Number(dSize));

      } catch (error) {
        console.error("Error al parsear el config de la plantilla:", error);
      }
    }
  };

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
      if (!res.ok) throw new Error(data.statusMessage || 'Error subiendo archivo');

      setUserPhotoUrl(data.url);
      toast.success('Foto de portada subida correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Hubo un error al subir la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalParaQuien = paraQuien === 'Otro' ? paraQuienOtro : paraQuien;
    const finalOcasion = ocasion === 'Otro' ? ocasionOtro : ocasion;
    const finalEstiloMusical = estiloMusical === 'Otro' ? estiloMusicalOtro : estiloMusical;

    if (!selectedTemplateId || !userPhotoUrl || !titulo || !artista || !whatsappNumber || !finalParaQuien || !finalOcasion || !finalEstiloMusical || !tipoVoz || !tono || !nombreDedicado || !historia) {
      toast.error('Por favor, completa todos los campos requeridos (incluyendo los detalles de la canción).');
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
          config: constructedConfig,
          paraQuien: finalParaQuien,
          ocasion: finalOcasion,
          estiloMusical: finalEstiloMusical,
          tipoVoz,
          tono,
          nombreDedicado,
          historia
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.statusMessage || 'Error al registrar petición');

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
            
            {/* SECCIÓN 1: Detalles para componer tu canción */}
            <h3 className="text-lg font-semibold mt-2 mb-4 border-b pb-2">1. Detalles para componer tu canción</h3>
            
            <div className="space-y-3">
              <Label>¿Para quién es la canción? <span className="text-red-500">*</span></Label>
              <Select value={paraQuien} onValueChange={setParaQuien}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {['Esposo/a', 'Novio/a', 'Mi pareja', 'Mama', 'Papa', 'Hijo/a', 'Amigo/a', 'Abuelo/a', 'Nieto/a', 'Para mi', 'Otro'].map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {paraQuien === 'Otro' && (
                <Input placeholder="Especifica para quién..." value={paraQuienOtro} onChange={e => setParaQuienOtro(e.target.value)} className="rounded-xl mt-2" />
              )}
            </div>

            <div className="space-y-3">
              <Label>¿Cuál es la ocasión? <span className="text-red-500">*</span></Label>
              <Select value={ocasion} onValueChange={setOcasion}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {['Solo para sorprender', 'San Valentin', 'Declararse', 'Cumpleaños', 'Aniversario', 'Pedir matrimonio', 'Pedir perdon', 'Boda', 'Dia de la madre', 'Dia del padre', 'Para mi', 'Otro'].map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ocasion === 'Otro' && (
                <Input placeholder="Especifica la ocasión..." value={ocasionOtro} onChange={e => setOcasionOtro(e.target.value)} className="rounded-xl mt-2" />
              )}
            </div>

            <div className="space-y-3">
              <Label>¿Qué estilo musical? <span className="text-red-500">*</span></Label>
              <Select value={estiloMusical} onValueChange={setEstiloMusical}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Selecciona un estilo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {['Balada romantica', 'Pop latino', 'Reggaeton romantico', 'Cumbia', 'Bachata', 'Salsa', 'Vallenato', 'Huayno peruano', 'Musica cristiana', 'Rock', 'Trap', 'Otro'].map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {estiloMusical === 'Otro' && (
                <Input placeholder="Especifica el estilo musical..." value={estiloMusicalOtro} onChange={e => setEstiloMusicalOtro(e.target.value)} className="rounded-xl mt-2" />
              )}
            </div>

            <div className="space-y-3">
              <Label>Voz masculina o femenina? <span className="text-red-500">*</span></Label>
              <Select value={tipoVoz} onValueChange={setTipoVoz}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Selecciona el tipo de voz" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {['Masculino', 'Femenina'].map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>¿Cuál es el tono de la canción? <span className="text-red-500">*</span></Label>
              <Select value={tono} onValueChange={setTono}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Selecciona el tono" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {['Romantica', 'Animada', 'Emocionante', 'Divertida', 'Reflexiva'].map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>A quien se lo dedicas? (Nombre) <span className="text-red-500">*</span></Label>
              <Input 
                value={nombreDedicado} 
                onChange={e => setNombreDedicado(e.target.value)} 
                placeholder="Ej. María"
                className="rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-3">
              <Label>Cuéntanos la historia de ustedes: <span className="text-red-500">*</span></Label>
              <Textarea 
                value={historia} 
                onChange={e => setHistoria(e.target.value)} 
                placeholder="Escribe aquí su historia..."
                className="rounded-xl border-gray-200 resize-none min-h-[140px]"
              />
              <p className="text-sm text-muted-foreground">
                [💡 ideas de qué contar: ♥ Cómo y dónde se conocieron ♥ Apodos y la forma cariñosa en que se llaman ♥ Un momento que los marcó ♥ Lo que más amas de esa persona ♥ Fechas especiales ♥ Una canción, lugar u olor que los recuerda ♥ El mensaje que quieres dejarle]
              </p>
            </div>

            {/* SECCIÓN 2: Detalles visuales del video */}
            <h3 className="text-lg font-semibold mt-8 mb-4 border-b pb-2">2. Detalles visuales del video</h3>
            
            <div className="space-y-3">
              <Label htmlFor="template">Plantilla de Fondo <span className="text-red-500">*</span></Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
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
                    onClick={() => setUserPhotoUrl('')}
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

            {/* SECCIÓN 3: Envío */}
            <h3 className="text-lg font-semibold mt-8 mb-4 border-b pb-2">3. Envío</h3>

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
            
            <div className="pt-6">
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
                  config={constructedConfig}
                  onUpdateConfig={() => {}} // Read-only for landing
                  backgroundUrl={backgroundUrl}
                  customBackground=""
                  userPhotoUrl={userPhotoUrl}
                  titulo={titulo}
                  artista={artista}
                  dedicatoria={dedicatoria}
                  
                  photoX={photoX}
                  photoY={photoY}
                  photoWidth={photoWidth}
                  photoHeight={photoHeight}
                  tituloX={tituloX}
                  tituloY={tituloY}
                  tituloSize={tituloSize}
                  artistaX={artistaX}
                  artistaY={artistaY}
                  artistaSize={artistaSize}
                  dedicatoriaX={dedicatoriaX}
                  dedicatoriaY={dedicatoriaY}
                  dedicatoriaSize={dedicatoriaSize}
                  
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
