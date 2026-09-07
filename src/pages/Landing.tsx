import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Loader2, 
  Image as ImageIcon, 
  UploadCloud, 
  X, 
  ChevronDown, 
  Check, 
  Music, 
  Sparkles, 
  Heart, 
  Palette, 
  MessageSquareText, 
  Send,
  Headphones,
  PlayCircle
} from 'lucide-react';
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
            handleTemplateSelect(data[0]);
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
        <DropdownMenuTrigger className="flex items-center justify-between w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#8B1F32] focus:border-[#8B1F32] text-left h-12 shadow-sm transition-all">
          <span className="truncate">
            {selectedTemplateId
              ? templates.find(x => x.id === selectedTemplateId)?.name || 'Plantilla seleccionada'
              : "Seleccionar plantilla..."}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-neutral-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[320px] bg-white border-neutral-200 max-h-64 overflow-y-auto rounded-xl">
          {templates.length === 0 ? (
            <div className="p-4 text-sm text-neutral-500 text-center">No hay plantillas disponibles.</div>
          ) : (
            <>
              {templatesWithBg.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider px-3 py-2">
                    Fondo + Posiciones
                  </DropdownMenuLabel>
                  {templatesWithBg.map(t => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => handleTemplateSelect(t)}
                      className="flex items-center justify-between cursor-pointer py-2.5 px-3 text-neutral-800 hover:bg-[#F5EADC]/40 focus:bg-[#F5EADC]/40 transition-colors"
                    >
                      <div className="flex items-center truncate w-full">
                        <Check className={`mr-2 h-4 w-4 shrink-0 text-[#8B1F32] ${selectedTemplateId === t.id ? "opacity-100" : "opacity-0"}`} />
                        <span className="truncate">{t.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              {templatesWithBg.length > 0 && templatesWithoutBg.length > 0 && (
                <DropdownMenuSeparator className="bg-neutral-100" />
              )}

              {templatesWithoutBg.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider px-3 py-2">
                    Solo Posiciones
                  </DropdownMenuLabel>
                  {templatesWithoutBg.map(t => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => handleTemplateSelect(t)}
                      className="flex items-center justify-between cursor-pointer py-2.5 px-3 text-neutral-800 hover:bg-[#F5EADC]/40 focus:bg-[#F5EADC]/40 transition-colors"
                    >
                      <div className="flex items-center truncate w-full">
                        <Check className={`mr-2 h-4 w-4 shrink-0 text-[#8B1F32]/70 ${selectedTemplateId === t.id ? "opacity-100" : "opacity-0"}`} />
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
    <div className="min-h-screen bg-[#F5EADC] font-sans selection:bg-[#8B1F32]/20">
      
      {/* HEADER SECTION */}
      <header className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8B1F32]/10 text-[#8B1F32] font-semibold text-xs uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Estudio de Canciones Personalizadas
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-neutral-900 tracking-tight leading-[1.1]">
          Convierte tu historia en una <br className="hidden sm:block" />
          <span className="text-[#8B1F32]">canción única</span>
        </h1>
        <p className="text-lg text-neutral-600 max-w-xl mx-auto leading-relaxed">
          Dinos qué sientes, elige el estilo musical y déjanos componer una obra de arte para esa persona especial.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* FORM COLUMN */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* BLOQUE 1: COMPOSICIÓN */}
            <div className="bg-white p-8 rounded-3xl border border-[#8B1F32]/15 shadow-md space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
                <Music className="w-24 h-24 text-[#8B1F32]" />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#8B1F32] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-[#8B1F32]/20 shrink-0">
                  1
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Cuéntanos tu Historia</h2>
                  <p className="text-sm text-neutral-500">Define el sentimiento y estilo de tu obra.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-[#8B1F32]" /> ¿Para quién es?
                    </Label>
                    <Select value={paraQuien} onValueChange={setParaQuien}>
                      <SelectTrigger className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all">
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {['Esposo/a', 'Novio/a', 'Mi pareja', 'Mama', 'Papa', 'Hijo/a', 'Amigo/a', 'Abuelo/a', 'Nieto/a', 'Para mi', 'Otro'].map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {paraQuien === 'Otro' && (
                      <Input placeholder="Especifica..." value={paraQuienOtro} onChange={e => setParaQuienOtro(e.target.value)} className="rounded-xl mt-2 text-sm" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#8B1F32]" /> ¿Cuál es la ocasión?
                    </Label>
                    <Select value={ocasion} onValueChange={setOcasion}>
                      <SelectTrigger className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all">
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {['Solo para sorprender', 'San Valentin', 'Declararse', 'Cumpleaños', 'Aniversario', 'Pedir matrimonio', 'Pedir perdon', 'Boda', 'Dia de la madre', 'Dia del padre', 'Para mi', 'Otro'].map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ocasion === 'Otro' && (
                      <Input placeholder="Especifica..." value={ocasionOtro} onChange={e => setOcasionOtro(e.target.value)} className="rounded-xl mt-2 text-sm" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Music className="w-3 h-3 text-[#8B1F32]" /> Estilo Musical
                    </Label>
                    <Select value={estiloMusical} onValueChange={setEstiloMusical}>
                      <SelectTrigger className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all">
                        <SelectValue placeholder="Selecciona estilo..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {['Balada romantica', 'Pop latino', 'Reggaeton romantico', 'Cumbia', 'Bachata', 'Salsa', 'Vallenato', 'Huayno peruano', 'Musica cristiana', 'Rock', 'Trap', 'Otro'].map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {estiloMusical === 'Otro' && (
                      <Input placeholder="Especifica..." value={estiloMusicalOtro} onChange={e => setEstiloMusicalOtro(e.target.value)} className="rounded-xl mt-2 text-sm" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Headphones className="w-3 h-3 text-[#8B1F32]" /> Voz del Cantante
                    </Label>
                    <Select value={tipoVoz} onValueChange={setTipoVoz}>
                      <SelectTrigger className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all">
                        <SelectValue placeholder="Tipo de voz..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {['Masculino', 'Femenina'].map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquareText className="w-3 h-3 text-[#8B1F32]" /> Tono Emocional
                  </Label>
                  <Select value={tono} onValueChange={setTono}>
                    <SelectTrigger className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all">
                      <SelectValue placeholder="Selecciona el tono..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {['Romantica', 'Animada', 'Emocionante', 'Divertida', 'Reflexiva'].map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Nombre de la persona dedicada</Label>
                  <Input 
                    value={nombreDedicado} 
                    onChange={e => setNombreDedicado(e.target.value)} 
                    placeholder="Ej. María"
                    className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Cuéntanos su historia de amor</Label>
                  <Textarea 
                    value={historia} 
                    onChange={e => setHistoria(e.target.value)} 
                    placeholder="Escribe aquí los momentos que los definen..."
                    className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all resize-none min-h-[160px]"
                  />
                  <div className="bg-[#F5EADC]/40 border border-dashed border-[#8B1F32]/20 p-4 rounded-xl text-[11px] leading-relaxed text-neutral-600">
                    <span className="font-bold text-[#8B1F32] block mb-1 uppercase tracking-widest">💡 Ideas para tu letra:</span>
                    • Momentos que los marcaron • Apodos cariñosos • Fechas especiales • Lo que más amas de esa persona • Un lugar u olor que los recuerde • El mensaje final que quieres dejarle.
                  </div>
                </div>
              </div>
            </div>

            {/* BLOQUE 2: DISEÑO VISUAL */}
            <div className="bg-white p-8 rounded-3xl border border-[#8B1F32]/15 shadow-md space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#8B1F32] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-[#8B1F32]/20 shrink-0">
                  2
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Personaliza tu Video</h2>
                  <p className="text-sm text-neutral-500">Elige la estética visual de tu regalo.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Plantilla Artística</Label>
                  {renderTemplateSelector()}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Foto de Portada</Label>
                  {!userPhotoUrl ? (
                    <div 
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        isUploading ? 'bg-[#F5EADC]/20 border-neutral-300' : 'hover:bg-[#F5EADC]/20 border-[#8B1F32]/20 hover:border-[#8B1F32] cursor-pointer'
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
                        <div className="flex flex-col items-center justify-center text-neutral-400">
                          <Loader2 className="h-8 w-8 animate-spin mb-2 text-[#8B1F32]" />
                          <span className="text-xs">Subiendo imagen...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <UploadCloud className="h-10 w-10 text-[#8B1F32]/60" />
                          <div>
                            <span className="text-sm font-semibold text-neutral-800">Sube tu foto favorita</span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5 uppercase tracking-tighter">JPG o PNG (Máx. 6MB)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative inline-block group">
                      <img src={userPhotoUrl} alt="Portada" className="h-32 w-32 object-cover rounded-xl shadow-lg border border-neutral-200" />
                      <button
                        type="button"
                        onClick={() => setUserPhotoUrl('')}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-md border border-neutral-100 text-neutral-400 hover:text-[#8B1F32] transition-all transform hover:scale-110"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Título de la Canción</Label>
                    <Input 
                      value={titulo} 
                      onChange={e => setTitulo(e.target.value)} 
                      placeholder="Ej. Nuestra Historia Eterna"
                      className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all"
                      maxLength={40}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Artista(s)</Label>
                    <Input 
                      value={artista} 
                      onChange={e => setArtista(e.target.value)} 
                      placeholder="Ej. Juan y María"
                      className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all"
                      maxLength={30}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Dedicatoria Final</Label>
                    <Textarea 
                      value={dedicatoria} 
                      onChange={e => setDedicatoria(e.target.value)} 
                      placeholder="Un pequeño mensaje de amor para el cierre..."
                      className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all resize-none min-h-[100px]"
                      maxLength={80}
                    />
                    <div className="text-[10px] text-right text-neutral-400 font-mono">
                      {dedicatoria.length}/80
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOQUE 3: ENTREGA */}
            <div className="bg-white p-8 rounded-3xl border border-[#8B1F32]/15 shadow-md space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#8B1F32] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-[#8B1F32]/20 shrink-0">
                  3
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Datos de Entrega</h2>
                  <p className="text-sm text-neutral-500">¿A dónde enviamos tu obra terminada?</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Número de WhatsApp (con prefijo)</Label>
                  <Input 
                    value={whatsappNumber} 
                    onChange={e => setWhatsappNumber(e.target.value)} 
                    placeholder="Ej. +34600000000"
                    className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] transition-all"
                    type="tel"
                  />
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl text-base font-bold shadow-xl bg-[#8B1F32] hover:bg-[#731929] shadow-[#8B1F32]/25 text-white transition-all transform hover:-translate-y-0.5 active:scale-95"
                    disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Componiendo tu obra...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Registrar Petición
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* PREVIEW COLUMN (ATRIL DE ESTUDIO) */}
          <div className="lg:sticky lg:top-12 flex flex-col items-center">
            <div className="w-full max-w-[360px] bg-white p-3 rounded-[40px] shadow-2xl border border-neutral-100 relative group">
              
              {/* STATUS HEADER */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-50 mb-3">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#8B1F32]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Estudio en vivo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">Preview</span>
                </div>
              </div>

              <div ref={previewContainerRef} className="rounded-[32px] overflow-hidden bg-neutral-950 aspect-[9/16] shadow-inner relative">
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
                
                {/* DECORATIVE OVERLAY */}
                <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 rounded-[32px]" />
              </div>

              {/* FOOTER DE CONFIANZA */}
              <div className="px-6 py-8 text-center space-y-3">
                <div className="flex justify-center -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-100 overflow-hidden shadow-sm">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed max-w-[220px] mx-auto italic">
                  "Al registrar tu pedido, nuestro productor musical comenzará los arreglos exclusivos para tu tema."
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      {/* FOOTER BRanding */}
      <footer className="py-12 border-t border-[#8B1F32]/10 bg-white/50 text-center">
        <p className="text-neutral-400 text-xs font-semibold uppercase tracking-[0.3em]">
          VideoFlow • Canciones con Alma
        </p>
      </footer>
    </div>
  );
}
