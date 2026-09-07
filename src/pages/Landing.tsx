import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, UploadCloud, X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VideoEditorPreview } from '@/components/VideoEditorPreview';
import { TemplateConfig } from './Dashboard';

const DEFAULT_CONFIG: TemplateConfig = {
  id: '',
  name: 'Plantilla por Defecto',
  bgUrl: '',
  photo: { x: 130, y: 180, w: 820, h: 820 },
  titulo: { x: 130, y: 1040, fontSize: 42, color: 'white', align: 'left' },
  artista: { x: 130, y: 1095, fontSize: 30, color: '#B3B3B3', align: 'left' },
  dedicatoria: { x: 540, y: 1620, fontSize: 28, color: '#E5E5E5', align: 'center' }
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

  const handleTemplateSelect = (t: any) => {
    setSelectedTemplateId(t.id);
    const parsedConfig = (t as any).config || t;
    // Parsea string a object si es necesario (doble stringify en db)
    const configData = typeof parsedConfig === 'string' ? JSON.parse(parsedConfig) : parsedConfig;
    
    const isCoords = configData.type === 'coordenadas';
    
    if (!isCoords) {
      const bg = configData.backgroundUrl || configData.bgUrl || t.bgUrl;
      if (bg !== undefined) {
        setBackgroundUrl(String(bg).trim());
      }
    }
    
    if (configData.photoUrl !== undefined) {
      setUserPhotoUrl(String(configData.photoUrl).trim());
    }
    
    if (configData.photoX !== undefined) setPhotoX(Number(configData.photoX));
    else if (configData.photo?.x !== undefined) setPhotoX(Number(configData.photo.x));

    if (configData.photoY !== undefined) setPhotoY(Number(configData.photoY));
    else if (configData.photo?.y !== undefined) setPhotoY(Number(configData.photo.y));

    if (configData.photoWidth !== undefined) setPhotoWidth(Number(configData.photoWidth));
    else if (configData.photo?.w !== undefined) setPhotoWidth(Number(configData.photo.w));

    if (configData.photoHeight !== undefined) setPhotoHeight(Number(configData.photoHeight));
    else if (configData.photo?.h !== undefined) setPhotoHeight(Number(configData.photo.h));

    if (configData.tituloX !== undefined) setTituloX(configData.tituloX);
    else if (configData.titulo?.x !== undefined) setTituloX(configData.titulo.x);

    if (configData.tituloY !== undefined) setTituloY(Number(configData.tituloY));
    else if (configData.titulo?.y !== undefined) setTituloY(Number(configData.titulo.y));

    if (configData.tituloSize !== undefined) setTituloSize(Number(configData.tituloSize));
    else if (configData.titulo?.fontSize !== undefined) setTituloSize(Number(configData.titulo.fontSize));

    if (configData.artistaX !== undefined) setArtistaX(configData.artistaX);
    else if (configData.artista?.x !== undefined) setArtistaX(configData.artista.x);

    if (configData.artistaY !== undefined) setArtistaY(Number(configData.artistaY));
    else if (configData.artista?.y !== undefined) setArtistaY(Number(configData.artista.y));

    if (configData.artistaSize !== undefined) setArtistaSize(Number(configData.artistaSize));
    else if (configData.artista?.fontSize !== undefined) setArtistaSize(Number(configData.artista.fontSize));

    const dX = configData.dedicatoriaX ?? configData.dedicatoryX ?? configData.dedicatoria?.x;
    const dY = configData.dedicatoriaY ?? configData.dedicatoryY ?? configData.dedicatoria?.y;
    let dSize = configData.dedicatoriaSize ?? configData.dedicatorySize ?? configData.dedicatoria?.fontSize;
    
    if (dX !== undefined) setDedicatoriaX(dX);
    if (dY !== undefined) setDedicatoriaY(Number(dY));
    if (dSize !== undefined) setDedicatoriaSize(Number(dSize));
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

  const renderTemplateSelector = () => {
    const templatesWithBg = templates.filter(t => {
      const parsedConfig = typeof t.config === 'string' ? JSON.parse(t.config) : (t.config || t);
      return parsedConfig.type !== 'coordenadas' && (parsedConfig.backgroundUrl || parsedConfig.bgUrl || (t as any).bgUrl);
    });

    const templatesWithoutBg = templates.filter(t => {
      const parsedConfig = typeof t.config === 'string' ? JSON.parse(t.config) : (t.config || t);
      return parsedConfig.type === 'coordenadas' || (!parsedConfig.backgroundUrl && !parsedConfig.bgUrl && !(t as any).bgUrl);
    });

    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 text-left h-12 shadow-sm">
          <span className="truncate">
            {selectedTemplateId
              ? templates.find(x => x.id === selectedTemplateId)?.name || 'Plantilla seleccionada'
              : "Seleccionar plantilla..."}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-gray-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[320px] bg-white border-gray-200 max-h-64 overflow-y-auto">
          {templates.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No hay plantillas.</div>
          ) : (
            <>
              {templatesWithBg.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Fondo + Posiciones
                  </DropdownMenuLabel>
                  {templatesWithBg.map(t => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => handleTemplateSelect(t)}
                      className="flex items-center justify-between cursor-pointer py-2 px-3 text-gray-800 hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <div className="flex items-center truncate w-full">
                        <Check className={`mr-2 h-4 w-4 shrink-0 text-indigo-600 ${selectedTemplateId === t.id ? "opacity-100" : "opacity-0"}`} />
                        <span className="truncate">{t.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              {templatesWithBg.length > 0 && templatesWithoutBg.length > 0 && (
                <DropdownMenuSeparator className="bg-gray-100" />
              )}

              {templatesWithoutBg.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Solo Posiciones
                  </DropdownMenuLabel>
                  {templatesWithoutBg.map(t => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => handleTemplateSelect(t)}
                      className="flex items-center justify-between cursor-pointer py-2 px-3 text-gray-800 hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <div className="flex items-center truncate w-full">
                        <Check className={`mr-2 h-4 w-4 shrink-0 text-purple-600 ${selectedTemplateId === t.id ? "opacity-100" : "opacity-0"}`} />
                        <span className="truncate">{t.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
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
              <Label>Plantilla de Fondo <span className="text-red-500">*</span></Label>
              {renderTemplateSelector()}
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
