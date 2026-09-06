import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Play, Settings, RefreshCw, Trash2, CheckCircle2, Clock, AlertCircle, Video, Music, Send, ChevronsUpDown, Check, ImagePlus, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VideoEditorPreview } from '../components/VideoEditorPreview';

type JobStatus = 'pending' | 'audio_ready' | 'video_ready' | 'sent' | 'error';

interface MediaJob {
  id: string;
  source: string;
  prompt: string;
  status: JobStatus;
  audioUrl: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  recipient: string | null;
  errorLog: string | null;
  createdAt: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  bgUrl: string;
  type?: 'completa' | 'coordenadas';
  photo: { x: number; y: number; w: number; h: number };
  titulo: { x: number; y: number; fontSize: number; color: string; align: 'left' | 'center' };
  artista: { x: number; y: number; fontSize: number; color: string; align: 'left' | 'center' };
  dedicatoria: { x: number; y: number; fontSize: number; color: string; align: 'left' | 'center' };
}

export const DEFAULT_TEMPLATE: TemplateConfig = {
  id: '',
  name: 'Plantilla por Defecto',
  bgUrl: 'image_f840ac.jpg',
  photo: { x: 130, y: 180, w: 820, h: 820 },
  titulo: { x: 130, y: 1040, fontSize: 42, color: 'white', align: 'left' },
  artista: { x: 130, y: 1095, fontSize: 30, color: '#B3B3B3', align: 'left' },
  dedicatoria: { x: 540, y: 1620, fontSize: 28, color: '#E5E5E5', align: 'center' },
};

const statusColors: Record<JobStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  audio_ready: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  video_ready: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  sent: 'bg-green-500/10 text-green-500 border-green-500/20',
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusIcons: Record<JobStatus, React.ReactNode> = {
  pending: <Clock className="w-3 h-3 mr-1" />,
  audio_ready: <Music className="w-3 h-3 mr-1" />,
  video_ready: <Video className="w-3 h-3 mr-1" />,
  sent: <CheckCircle2 className="w-3 h-3 mr-1" />,
  error: <AlertCircle className="w-3 h-3 mr-1" />,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'history' | 'studio'>('history');
  
  // History state
  const [jobs, setJobs] = useState<MediaJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Regenerate Video Modal State
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regenerateJobId, setRegenerateJobId] = useState<string | null>(null);
  const [regenerateBgUrl, setRegenerateBgUrl] = useState('image_f840ac.jpg');
  const [regenerateCustomBg, setRegenerateCustomBg] = useState('');
  const [regenerateUserPhotoUrl, setRegenerateUserPhotoUrl] = useState('');
  const [regenerateTitulo, setRegenerateTitulo] = useState('');
  const [regenerateArtista, setRegenerateArtista] = useState('');
  const [regenerateDedicatoria, setRegenerateDedicatoria] = useState('');
  const [regenerateDedicatoriaSize, setRegenerateDedicatoriaSize] = useState(28); // New stat
  const [regenerateTemplateConfig, setRegenerateTemplateConfig] = useState<TemplateConfig>(DEFAULT_TEMPLATE);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Combobox and Modals State
  const [isRegenAddBgModalOpen, setIsRegenAddBgModalOpen] = useState(false);
  const [regenNewBgUrl, setRegenNewBgUrl] = useState('');
  const [isStudioAddBgModalOpen, setIsStudioAddBgModalOpen] = useState(false);
  const [studioNewBgUrl, setStudioNewBgUrl] = useState('');

  // WhatsApp Modal State
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [whatsappJobId, setWhatsappJobId] = useState<string | null>(null);
  const [whatsappModalPhone, setWhatsappModalPhone] = useState('');
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);

  // Studio state
  const [studioStep, setStudioStep] = useState(1);
  const [studioJobId, setStudioJobId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  
  // Studio Step 2 (Video Player 9:16 fields)
  const [backgroundUrl, setBackgroundUrl] = useState('image_f840ac.jpg');
  const [customBackground, setCustomBackground] = useState('');
  const [userPhotoUrl, setUserPhotoUrl] = useState('');
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [dedicatoria, setDedicatoria] = useState('');
  const [dedicatoriaSize, setDedicatoriaSize] = useState(28); // New stat
  const [studioTemplateConfig, setStudioTemplateConfig] = useState<TemplateConfig>(DEFAULT_TEMPLATE);
  
  // Custom Templates from DB
  const [dbTemplates, setDbTemplates] = useState<TemplateConfig[]>([]);

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

  const handleSaveTemplate = async (config: TemplateConfig, bgUrl: string, dedicatoriaSz: number, mode: 'completa' | 'coordenadas') => {
    const promptedName = window.prompt(`Nombre de la nueva plantilla (${mode}):`);
    if (promptedName === null) return;
    const templateName = promptedName.trim() || 'Mi Plantilla Personalizada';
    
    try {
      let payloadConfig: any = {
        type: mode,
        photoX: Number(config.photo.x),
        photoY: Number(config.photo.y),
        photoWidth: Number(config.photo.w),
        photoHeight: Number(config.photo.h),
        tituloX: Number(config.titulo.x),
        tituloY: Number(config.titulo.y),
        tituloSize: Number(config.titulo.fontSize),
        artistaX: Number(config.artista.x),
        artistaY: Number(config.artista.y),
        artistaSize: Number(config.artista.fontSize),
        dedicatoriaX: Number(config.dedicatoria.x),
        dedicatoriaY: Number(config.dedicatoria.y),
        dedicatoriaSize: Number(dedicatoriaSz),
        ...(mode === 'completa' ? { backgroundUrl: bgUrl, bgUrl: bgUrl } : {}),
        // Anidados requeridos por el componente visual
        photo: { ...config.photo, x: Number(config.photo.x), y: Number(config.photo.y), w: Number(config.photo.w), h: Number(config.photo.h) },
        titulo: { ...config.titulo, x: Number(config.titulo.x), y: Number(config.titulo.y), fontSize: Number(config.titulo.fontSize) },
        artista: { ...config.artista, x: Number(config.artista.x), y: Number(config.artista.y), fontSize: Number(config.artista.fontSize) },
        dedicatoria: { ...config.dedicatoria, x: Number(config.dedicatoria.x), y: Number(config.dedicatoria.y), fontSize: Number(dedicatoriaSz) }
      };

      const res = await fetch('/api/templates/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: templateName,
          config: payloadConfig
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('Plantilla guardada!');
        loadTemplates();
      } else {
        alert(`Error al guardar plantilla: ${data.statusMessage || data.message || 'Error desconocido'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error al guardar: ${e.message || 'Error de red'}`);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!templateId) return alert("Error: ID inválido");
    
    try {
      const res = await fetch('/api/templates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.statusMessage || "Error desconocido al eliminar");
      }

      setDbTemplates(prev => prev.filter(t => t.id !== templateId));
      
      if (studioTemplateConfig.id === templateId) {
        setStudioTemplateConfig(DEFAULT_TEMPLATE);
        setBackgroundUrl('image_f840ac.jpg');
        setCustomBackground('');
      }
      
      if (regenerateTemplateConfig.id === templateId) {
        setRegenerateTemplateConfig(DEFAULT_TEMPLATE);
        setRegenerateBgUrl('image_f840ac.jpg');
        setRegenerateCustomBg('');
      }
      
      alert("Éxito: Plantilla eliminada permanentemente.");
    } catch (error: any) {
      console.error("Error UI:", error);
      alert(`Error al eliminar: ${error.message}`);
    }
  };
  
  // Studio Step 3
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [studioAudioUrl, setStudioAudioUrl] = useState<string | null>(null);
  const [studioVideoUrl, setStudioVideoUrl] = useState<string | null>(null);

  // Load Studio State from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('videoFlowStudioState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.studioStep) setStudioStep(parsed.studioStep);
        if (parsed.studioJobId) setStudioJobId(parsed.studioJobId);
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.backgroundUrl) setBackgroundUrl(parsed.backgroundUrl);
        if (parsed.customBackground) setCustomBackground(parsed.customBackground);
        if (parsed.userPhotoUrl) setUserPhotoUrl(parsed.userPhotoUrl);
        if (parsed.titulo) setTitulo(parsed.titulo);
        if (parsed.artista) setArtista(parsed.artista);
        if (parsed.dedicatoria) setDedicatoria(parsed.dedicatoria);
        if (parsed.dedicatoriaSize) setDedicatoriaSize(parsed.dedicatoriaSize);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.studioAudioUrl) setStudioAudioUrl(parsed.studioAudioUrl);
        if (parsed.studioVideoUrl) setStudioVideoUrl(parsed.studioVideoUrl);
      } catch (e) {
        console.error("Failed to parse studio state from localStorage", e);
      }
    }
  }, []);

  // Save Studio State to LocalStorage
  useEffect(() => {
    const stateToSave = {
      studioStep,
      studioJobId,
      prompt,
      backgroundUrl,
      customBackground,
      userPhotoUrl,
      titulo,
      artista,
      dedicatoria,
      dedicatoriaSize,
      phone,
      studioAudioUrl,
      studioVideoUrl,
    };
    localStorage.setItem('videoFlowStudioState', JSON.stringify(stateToSave));
  }, [
    studioStep, studioJobId, prompt, backgroundUrl, customBackground,
    userPhotoUrl, titulo, artista, dedicatoria, dedicatoriaSize, phone, studioAudioUrl, studioVideoUrl
  ]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/media/jobs');
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchJobs();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job and its files?')) return;
    try {
      await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchJobs();
    } catch (err) {
      console.error(err);
    }
  };

  // History action: Regenerate Video
  const handleRegenerateVideo = async () => {
    const finalBg = regenerateBgUrl === 'custom' ? regenerateCustomBg : regenerateBgUrl;
    if (!regenerateJobId || !regenerateUserPhotoUrl || !regenerateTitulo || !regenerateArtista || (regenerateBgUrl === 'custom' && !regenerateCustomBg)) return;
    setIsRegenerating(true);

    try {
      const res = await fetch('/api/manual/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: regenerateJobId,
          backgroundUrl: finalBg,
          userPhotoUrl: regenerateUserPhotoUrl,
          titulo: regenerateTitulo,
          artista: regenerateArtista,
          dedicatoria: regenerateDedicatoria,
          dedicatoriaSize: regenerateDedicatoriaSize,
          templateConfig: regenerateTemplateConfig
        })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        setIsRegenerateModalOpen(false);
        fetchJobs();
      } else {
        alert(`Failed to generate video: ${data.statusMessage || data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || 'Network error occurred'}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Studio Handlers
  const handleGenerateAudio = async () => {
    if (!prompt) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/manual/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.job) {
        setStudioJobId(data.job.id);
        setStudioAudioUrl(data.job.audioUrl);
        setStudioStep(2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateVideo = async () => {
    const finalBg = backgroundUrl === 'custom' ? customBackground : backgroundUrl;
    if (!finalBg || !userPhotoUrl || !titulo || !artista || !studioJobId) return;
    
    setIsProcessing(true);

    try {
      const res = await fetch('/api/manual/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: studioJobId,
          backgroundUrl: finalBg,
          userPhotoUrl,
          titulo,
          artista,
          dedicatoria,
          templateConfig: studioTemplateConfig
        })
      });
      const data = await res.json();
      if (res.ok && data.job) {
        setStudioVideoUrl(data.job.videoUrl);
        setStudioStep(3);
      } else {
        alert(`Error generating video: ${data.statusMessage || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error: Network error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendWhatsapp = async () => {
    if (!phone || !studioJobId) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/manual/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: studioJobId, whatsappNumber: phone })
      });
      
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('Sent successfully!');
        handleResetStudio();
      } else {
        alert(`Failed to send WhatsApp: ${data.statusMessage || data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || 'Network error occurred'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendWhatsappFromModal = async () => {
    if (!whatsappModalPhone || !whatsappJobId) return;
    setIsSendingWhatsapp(true);
    try {
      const res = await fetch('/api/manual/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: whatsappJobId, whatsappNumber: whatsappModalPhone })
      });
      
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsWhatsappModalOpen(false);
        setWhatsappModalPhone('');
        fetchJobs();
        alert('Sent successfully!');
      } else {
        alert(`Failed to send WhatsApp: ${data.statusMessage || data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || 'Network error occurred'}`);
    } finally {
      setIsSendingWhatsapp(false);
    }
  };

  const handleResetStudio = () => {
    setStudioStep(1);
    setStudioJobId(null);
    setPrompt('');
    setBackgroundUrl('image_f840ac.jpg');
    setCustomBackground('');
    setUserPhotoUrl('');
    setTitulo('');
    setArtista('');
    setDedicatoria('');
    setPhone('');
    setStudioAudioUrl(null);
    setStudioVideoUrl(null);
    setStudioTemplateConfig(DEFAULT_TEMPLATE);
    localStorage.removeItem('videoFlowStudioState');
  };

  const renderTemplateSelector = (
    currentConfigId: string,
    setConfig: (config: TemplateConfig) => void,
    setBg: (bg: string) => void,
    setCustomBg: (bg: string) => void,
    isProcessing: boolean,
    onAddBgClick: () => void,
    setDedicatoriaSizeState?: (size: number) => void
  ) => (
    <div className="flex gap-2 mb-3">
      <DropdownMenu>
        <DropdownMenuTrigger disabled={isProcessing} className="flex items-center justify-between w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-left h-12">
          <span className="truncate">
            {currentConfigId
              ? dbTemplates.find(x => x.id === currentConfigId)?.name || 'Plantilla seleccionada'
              : "Seleccionar plantilla..."}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[320px] bg-[#1F2937] border-gray-700 max-h-64 overflow-y-auto">
          {dbTemplates.length === 0 ? (
            <div className="p-4 text-sm text-gray-400 text-center">No hay plantillas.</div>
          ) : (
            dbTemplates.map(t => {
              const parsedConfig = (t as any).config || t;
              const isCoords = parsedConfig.type === 'coordenadas';
              return (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => {
                    if (!isCoords) {
                      const bg = parsedConfig.backgroundUrl || parsedConfig.bgUrl || t.bgUrl;
                      if (bg) {
                        setBg(bg || 'custom');
                        if (bg.startsWith('http')) setCustomBg(bg);
                      }
                    }
                    
                    const nextConfig = { ...JSON.parse(JSON.stringify(parsedConfig)), id: t.id };
                    
                    if (!nextConfig.dedicatoria) {
                      nextConfig.dedicatoria = { ...DEFAULT_TEMPLATE.dedicatoria };
                    }
                    
                    if (parsedConfig.dedicatoriaX !== undefined) nextConfig.dedicatoria.x = Number(parsedConfig.dedicatoriaX);
                    else if (parsedConfig.dedicatoryX !== undefined) nextConfig.dedicatoria.x = Number(parsedConfig.dedicatoryX);

                    if (parsedConfig.dedicatoriaY !== undefined) nextConfig.dedicatoria.y = Number(parsedConfig.dedicatoriaY);
                    else if (parsedConfig.dedicatoryY !== undefined) nextConfig.dedicatoria.y = Number(parsedConfig.dedicatoryY);

                    let dedicatoriaSz = nextConfig.dedicatoria.fontSize;
                    if (parsedConfig.dedicatoriaSize !== undefined) dedicatoriaSz = Number(parsedConfig.dedicatoriaSize);
                    else if (parsedConfig.dedicatorySize !== undefined) dedicatoriaSz = Number(parsedConfig.dedicatorySize);
                    
                    nextConfig.dedicatoria.fontSize = dedicatoriaSz;
                    
                    if (setDedicatoriaSizeState) {
                      setDedicatoriaSizeState(dedicatoriaSz);
                    }

                    setConfig(nextConfig);
                  }}
                  className="flex items-center justify-between cursor-pointer py-2 px-3 text-white hover:bg-[#374151] focus:bg-[#374151] focus:text-white"
                >
                  <div className="flex items-center truncate mr-2 w-full">
                    <Check
                      className={`mr-2 h-4 w-4 shrink-0 ${currentConfigId === t.id ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className={`truncate ${isCoords ? "text-purple-300" : "text-indigo-300"}`}>
                      {isCoords ? '[Posiciones]' : '[Fondo]'} {t.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteTemplate(t.id);
                    }}
                    className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-md transition-colors shrink-0 z-10"
                    title="Eliminar plantilla"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        disabled={isProcessing}
        onClick={onAddBgClick}
        className="flex items-center justify-center w-12 h-12 shrink-0 bg-[#1F2937] hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 border border-gray-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
        title="Añadir Fondo de Reproductor"
      >
        <ImagePlus className="w-5 h-5" />
      </button>
    </div>
  );

  const renderConfigControls = (config: TemplateConfig, setConfig: any, key: 'titulo'|'artista'|'dedicatoria', extSizeState?: number, setExtSizeState?: any) => (
    <div className="flex gap-2 mt-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">X:</span>
        <input
          type="number"
          value={config[key].x === 'center' ? '' : config[key].x}
          onChange={(e) => setConfig({...config, [key]: {...config[key], x: Number(e.target.value), align: 'left'}})}
          className="w-16 px-2 py-1 bg-[#1A2333] border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Ctr"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Y:</span>
        <input
          type="number"
          value={config[key].y}
          onChange={(e) => setConfig({...config, [key]: {...config[key], y: Number(e.target.value)}})}
          className="w-16 px-2 py-1 bg-[#1A2333] border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Size:</span>
        <input
          type="number"
          value={extSizeState !== undefined ? extSizeState : config[key].fontSize}
          onChange={(e) => {
            const val = Number(e.target.value);
            setConfig({...config, [key]: {...config[key], fontSize: val}});
            if (setExtSizeState) setExtSizeState(val);
          }}
          className="w-16 px-2 py-1 bg-[#1A2333] border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );

  const renderPhotoControls = (config: TemplateConfig, setConfig: any) => (
    <div className="flex gap-2 mt-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">X:</span>
        <input
          type="number"
          value={config.photo.x}
          onChange={(e) => setConfig({...config, photo: {...config.photo, x: Number(e.target.value)}})}
          className="w-14 md:w-16 px-2 py-1 bg-[#1A2333] border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Y:</span>
        <input
          type="number"
          value={config.photo.y}
          onChange={(e) => setConfig({...config, photo: {...config.photo, y: Number(e.target.value)}})}
          className="w-14 md:w-16 px-2 py-1 bg-[#1A2333] border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">W:</span>
        <input
          type="number"
          value={config.photo.w}
          onChange={(e) => setConfig({...config, photo: {...config.photo, w: Number(e.target.value)}})}
          className="w-14 md:w-16 px-2 py-1 bg-[#1A2333] border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">H:</span>
        <input
          type="number"
          value={config.photo.h}
          onChange={(e) => setConfig({...config, photo: {...config.photo, h: Number(e.target.value)}})}
          className="w-14 md:w-16 px-2 py-1 bg-[#1A2333] border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-[#0B0F19] text-gray-200 p-8">
      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex space-x-1 bg-[#1F2937] p-1 rounded-xl w-fit mb-8 border border-gray-800">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            History & Control
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'studio' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            Manual Studio
          </button>
        </div>

        {/* Content */}
        {activeTab === 'history' && (
          <div className="bg-[#111827] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#171F2E]">
              <h2 className="text-lg font-semibold text-white">Media Jobs</h2>
              <button 
                onClick={fetchJobs}
                className="p-2 text-gray-400 hover:text-indigo-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#171F2E] text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Source</th>
                    <th className="px-6 py-4 font-medium">Prompt / Info</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Media</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {jobs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No jobs found.
                      </td>
                    </tr>
                  )}
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-[#1A2333] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          job.source === 'n8n' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {job.source.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-gray-300" title={job.prompt}>
                        {job.prompt}
                        {job.recipient && <div className="text-xs text-gray-500 mt-1">To: {job.recipient}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[job.status]}`}>
                          {statusIcons[job.status]}
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          {job.audioUrl && (
                            <div className="flex items-center text-xs">
                              <span className="w-12 text-gray-500">Audio:</span>
                              <audio controls className="h-8 max-w-[150px] opacity-80" src={job.audioUrl}></audio>
                            </div>
                          )}
                          {job.videoUrl && (
                            <div className="flex items-center text-xs">
                              <span className="w-12 text-gray-500">Video:</span>
                              <video controls className="h-12 w-20 bg-black rounded" src={job.videoUrl}></video>
                            </div>
                          )}
                          {!job.audioUrl && !job.videoUrl && <span className="text-gray-600 italic">None</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        {job.audioUrl && (
                          <button
                            onClick={() => {
                              setRegenerateJobId(job.id);
                              setRegenerateBgUrl('image_f840ac.jpg');
                              setRegenerateCustomBg('');
                              setRegenerateUserPhotoUrl(job.imageUrl || '');
                              setRegenerateTitulo('');
                              setRegenerateArtista('');
                              setRegenerateDedicatoria('');
                              setIsRegenerateModalOpen(true);
                            }}
                            className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors inline-block"
                            title="Generate or Regenerate Video"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        )}
                        {job.videoUrl && (
                          <button
                            onClick={() => {
                              setWhatsappJobId(job.id);
                              setWhatsappModalPhone(job.recipient || '');
                              setIsWhatsappModalOpen(true);
                            }}
                            className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors inline-block"
                            title="Send via WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-block"
                          title="Delete physically and from DB"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'studio' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#111827] rounded-2xl border border-gray-800 p-8 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Manual Studio</h2>
                {studioJobId && (
                  <button 
                    onClick={handleResetStudio}
                    className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Clear and start new job
                  </button>
                )}
              </div>
              
              {/* Step 1 */}
              <div className={`relative pl-8 pb-8 ${studioStep === 1 ? 'opacity-100' : 'opacity-60'}`}>
                <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  studioStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  1
                </div>
                {studioStep > 1 && <div className="absolute left-3 top-6 bottom-0 w-px bg-indigo-600/50"></div>}
                
                <h3 className="text-lg font-medium text-white mb-4">Generate Audio (Lyria)</h3>
                <div className="space-y-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={studioStep !== 1 || isProcessing}
                    placeholder="Enter prompt for audio generation..."
                    className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none disabled:opacity-50"
                  />
                  {studioStep === 1 && (
                    <button
                      onClick={handleGenerateAudio}
                      disabled={!prompt || isProcessing}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Music className="w-4 h-4 mr-2" />}
                      Generate Audio
                    </button>
                  )}
                  {studioAudioUrl && (
                    <div className="mt-4 p-4 bg-[#171F2E] rounded-xl border border-gray-800">
                      <p className="text-sm text-gray-400 mb-2">Generated Audio:</p>
                      <audio controls className="w-full h-10" src={studioAudioUrl}></audio>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className={`relative pl-8 pb-8 ${studioStep === 2 ? 'opacity-100' : 'opacity-60'}`}>
                <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  studioStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  2
                </div>
                {studioStep > 2 && <div className="absolute left-3 top-6 bottom-0 w-px bg-indigo-600/50"></div>}
                
                <h3 className="text-lg font-medium text-white mb-4">Generate Video (9:16 Player)</h3>
                <div className="space-y-5">
                  
                  {/* Selector de Fondo */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fondo del Reproductor / Plantilla</label>
                    {renderTemplateSelector(
                      studioTemplateConfig.id,
                      setStudioTemplateConfig,
                      setBackgroundUrl,
                      setCustomBackground,
                      isProcessing,
                      () => setIsStudioAddBgModalOpen(true),
                      setDedicatoriaSize
                    )}
                  </div>

                  {/* URL de Foto de Usuario */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Foto de Portada (URL)</label>
                    <input
                      type="url"
                      value={userPhotoUrl}
                      onChange={(e) => setUserPhotoUrl(e.target.value)}
                      disabled={studioStep !== 2 || isProcessing}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    {renderPhotoControls(studioTemplateConfig, setStudioTemplateConfig)}
                  </div>

                  {/* Datos de la canción */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Título de la Canción</label>
                      <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        disabled={studioStep !== 2 || isProcessing}
                        placeholder="Ej. Nuestra Historia"
                        className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      {renderConfigControls(studioTemplateConfig, setStudioTemplateConfig, 'titulo')}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Artista</label>
                      <input
                        type="text"
                        value={artista}
                        onChange={(e) => setArtista(e.target.value)}
                        disabled={studioStep !== 2 || isProcessing}
                        placeholder="Ej. Juan & María"
                        className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      {renderConfigControls(studioTemplateConfig, setStudioTemplateConfig, 'artista')}
                    </div>
                  </div>

                  {/* Dedicatoria */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Dedicatoria (opcional)</label>
                    <textarea
                      value={dedicatoria}
                      onChange={(e) => setDedicatoria(e.target.value)}
                      disabled={studioStep !== 2 || isProcessing}
                      placeholder="Un pequeño mensaje que aparecerá en el video..."
                      rows={2}
                      className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
                    />
                    {renderConfigControls(studioTemplateConfig, setStudioTemplateConfig, 'dedicatoria', dedicatoriaSize, setDedicatoriaSize)}
                  </div>

                  {/* Live Preview */}
                  <div className="mt-6 flex flex-col items-center">
                    <p className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Live Preview Editor</p>
                    <div className="w-[280px] h-[497.77px]">
                      <VideoEditorPreview
                        config={studioTemplateConfig}
                        onUpdateConfig={setStudioTemplateConfig}
                        backgroundUrl={backgroundUrl}
                        customBackground={customBackground}
                        userPhotoUrl={userPhotoUrl}
                        titulo={titulo}
                        artista={artista}
                        dedicatoria={dedicatoria}
                        dedicatoriaSize={dedicatoriaSize}
                        scale={0.259259}
                      />
                    </div>
                  </div>

                  {/* Live Preview Save Button */}
                  {studioStep === 2 && (
                    <div className="flex flex-col items-center gap-2 mt-4 bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                      <span className="text-xs text-gray-400 font-medium">Guardar Diseño Actual:</span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSaveTemplate(studioTemplateConfig, backgroundUrl === 'custom' ? customBackground : backgroundUrl, dedicatoriaSize, 'completa')}
                          className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                        >
                          Fondo + Posiciones
                        </button>
                        <span className="text-gray-600">|</span>
                        <button
                          onClick={() => handleSaveTemplate(studioTemplateConfig, backgroundUrl === 'custom' ? customBackground : backgroundUrl, dedicatoriaSize, 'coordenadas')}
                          className="text-xs text-purple-400 hover:text-purple-300 underline"
                        >
                          Solo Posiciones
                        </button>
                      </div>
                    </div>
                  )}

                  {studioStep === 2 && (
                    <button
                      onClick={handleGenerateVideo}
                      disabled={(!userPhotoUrl || !titulo || !artista || (backgroundUrl === 'custom' && !customBackground)) || isProcessing}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                      Generate Video
                    </button>
                  )}
                  {studioVideoUrl && (
                    <div className="mt-4 p-4 bg-[#171F2E] rounded-xl border border-gray-800 flex justify-center">
                      <div className="w-full max-w-[280px]">
                        <p className="text-sm text-gray-400 mb-2">Generated Video:</p>
                        <video controls className="w-full bg-black rounded-lg aspect-[9/16]" src={studioVideoUrl}></video>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className={`relative pl-8 ${studioStep === 3 ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  studioStep === 3 ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  3
                </div>
                
                <h3 className="text-lg font-medium text-white mb-4">Send via WhatsApp (YCloud)</h3>
                <div className="space-y-4">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={studioStep !== 3 || isProcessing}
                    placeholder="Enter phone number (e.g. +1234567890)"
                    className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  {studioStep === 3 && (
                    <button
                      onClick={handleSendWhatsapp}
                      disabled={!phone || isProcessing}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Send via WhatsApp
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Regenerate Video Modal */}
        <Dialog open={isRegenerateModalOpen} onOpenChange={setIsRegenerateModalOpen}>
          <DialogContent className="bg-[#111827] border-gray-800 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate/Regenerate Video</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col md:flex-row gap-8 py-4">
              
              {/* Form Col */}
              <div className="flex-1 space-y-4">
                <p className="text-sm text-gray-400">Provide the 9:16 player metadata to combine with the existing audio track.</p>
                
                {/* Selector de Fondo */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Fondo del Reproductor / Plantilla</label>
                  {renderTemplateSelector(
                    regenerateTemplateConfig.id,
                    setRegenerateTemplateConfig,
                    setRegenerateBgUrl,
                    setRegenerateCustomBg,
                    isRegenerating,
                    () => setIsRegenAddBgModalOpen(true),
                    setRegenerateDedicatoriaSize
                  )}
                </div>

                {/* URL de Foto de Usuario */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Foto de Portada (URL)</label>
                  <input
                    type="url"
                    value={regenerateUserPhotoUrl}
                    onChange={(e) => setRegenerateUserPhotoUrl(e.target.value)}
                    disabled={isRegenerating}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm bg-[#1F2937] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  {renderPhotoControls(regenerateTemplateConfig, setRegenerateTemplateConfig)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Título</label>
                    <input
                      type="text"
                      value={regenerateTitulo}
                      onChange={(e) => setRegenerateTitulo(e.target.value)}
                      disabled={isRegenerating}
                      placeholder="Ej. Nuestra Historia"
                      className="w-full px-3 py-2 text-sm bg-[#1F2937] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    {renderConfigControls(regenerateTemplateConfig, setRegenerateTemplateConfig, 'titulo')}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Artista</label>
                    <input
                      type="text"
                      value={regenerateArtista}
                      onChange={(e) => setRegenerateArtista(e.target.value)}
                      disabled={isRegenerating}
                      placeholder="Ej. Juan & María"
                      className="w-full px-3 py-2 text-sm bg-[#1F2937] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    {renderConfigControls(regenerateTemplateConfig, setRegenerateTemplateConfig, 'artista')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Dedicatoria (opcional)</label>
                  <textarea
                    value={regenerateDedicatoria}
                    onChange={(e) => setRegenerateDedicatoria(e.target.value)}
                    disabled={isRegenerating}
                    placeholder="Un pequeño mensaje..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-[#1F2937] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
                  />
                  {renderConfigControls(regenerateTemplateConfig, setRegenerateTemplateConfig, 'dedicatoria', regenerateDedicatoriaSize, setRegenerateDedicatoriaSize)}
                </div>
              </div>

              {/* Live Preview Col */}
              <div className="shrink-0 flex flex-col items-center justify-center">
                <p className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Live Preview Editor</p>
                <div className="w-[220px] h-[391.11px]">
                  <VideoEditorPreview
                    config={regenerateTemplateConfig}
                    onUpdateConfig={setRegenerateTemplateConfig}
                    backgroundUrl={regenerateBgUrl}
                    customBackground={regenerateCustomBg}
                    userPhotoUrl={regenerateUserPhotoUrl}
                    titulo={regenerateTitulo}
                    artista={regenerateArtista}
                    dedicatoria={regenerateDedicatoria}
                    dedicatoriaSize={regenerateDedicatoriaSize}
                    scale={0.2037}
                  />
                </div>
                <div className="flex flex-col items-center gap-2 mt-4 bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                  <span className="text-xs text-gray-400 font-medium">Guardar Diseño Actual:</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSaveTemplate(regenerateTemplateConfig, regenerateBgUrl === 'custom' ? regenerateCustomBg : regenerateBgUrl, regenerateDedicatoriaSize, 'completa')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Fondo + Posiciones
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      onClick={() => handleSaveTemplate(regenerateTemplateConfig, regenerateBgUrl === 'custom' ? regenerateCustomBg : regenerateBgUrl, regenerateDedicatoriaSize, 'coordenadas')}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                    >
                      Solo Posiciones
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <button
                onClick={() => setIsRegenerateModalOpen(false)}
                disabled={isRegenerating}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateVideo}
                disabled={(!regenerateUserPhotoUrl || !regenerateTitulo || !regenerateArtista || (regenerateBgUrl === 'custom' && !regenerateCustomBg)) || isRegenerating}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {isRegenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                Generate
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send WhatsApp Modal */}
        <Dialog open={isWhatsappModalOpen} onOpenChange={setIsWhatsappModalOpen}>
          <DialogContent className="bg-[#111827] border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Send via WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-400">Enter the recipient's phone number including the country code.</p>
              <input
                type="tel"
                value={whatsappModalPhone}
                onChange={(e) => setWhatsappModalPhone(e.target.value)}
                disabled={isSendingWhatsapp}
                placeholder="e.g. +1234567890"
                className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              />
            </div>
            <DialogFooter>
              <button
                onClick={() => setIsWhatsappModalOpen(false)}
                disabled={isSendingWhatsapp}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWhatsappFromModal}
                disabled={!whatsappModalPhone || isSendingWhatsapp}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {isSendingWhatsapp ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Add Studio Custom Bg Modal */}
        <Dialog open={isStudioAddBgModalOpen} onOpenChange={setIsStudioAddBgModalOpen}>
          <DialogContent className="bg-[#111827] border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Añadir Fondo de Reproductor</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="block text-sm text-gray-400 mb-2">URL del fondo</label>
              <input
                type="url"
                value={studioNewBgUrl}
                onChange={(e) => setStudioNewBgUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <DialogFooter>
              <button
                onClick={() => setIsStudioAddBgModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setBackgroundUrl('custom');
                  setCustomBackground(studioNewBgUrl);
                  setIsStudioAddBgModalOpen(false);
                  setStudioNewBgUrl('');
                }}
                disabled={!studioNewBgUrl}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Regen Custom Bg Modal */}
        <Dialog open={isRegenAddBgModalOpen} onOpenChange={setIsRegenAddBgModalOpen}>
          <DialogContent className="bg-[#111827] border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Añadir Fondo de Reproductor</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="block text-sm text-gray-400 mb-2">URL del fondo</label>
              <input
                type="url"
                value={regenNewBgUrl}
                onChange={(e) => setRegenNewBgUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <DialogFooter>
              <button
                onClick={() => setIsRegenAddBgModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setRegenerateBgUrl('custom');
                  setRegenerateCustomBg(regenNewBgUrl);
                  setIsRegenAddBgModalOpen(false);
                  setRegenNewBgUrl('');
                }}
                disabled={!regenNewBgUrl}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Confirmar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
