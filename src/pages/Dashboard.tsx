import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LogOut,
  Play,
  Settings,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Video,
  Music,
  Send,
  ChevronsUpDown,
  Check,
  ImagePlus,
  ChevronDown,
  LayoutDashboard,
  Mic2,
  Sparkles,
  Headphones
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VideoEditorPreview } from '../components/VideoEditorPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type JobStatus = 'pending' | 'pendiente' | 'audio_ready' | 'video_ready' | 'sent' | 'error';

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
  backgroundUrl?: string;
  userPhotoUrl?: string;
  titulo?: string;
  artista?: string;
  dedicatoria?: string;
  config?: any;
  whatsappNumber?: string;
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
  bgUrl: '',
  photo: { x: 130, y: 180, w: 820, h: 820 },
  titulo: { x: 130, y: 1040, fontSize: 42, color: 'white', align: 'left' },
  artista: { x: 130, y: 1095, fontSize: 30, color: '#B3B3B3', align: 'left' },
  dedicatoria: { x: 540, y: 1620, fontSize: 28, color: '#E5E5E5', align: 'center' },
};

const statusColors: Record<JobStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  audio_ready: 'bg-blue-100 text-blue-700 border-blue-200',
  video_ready: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  sent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  error: 'bg-rose-100 text-rose-700 border-rose-200',
};

const statusIcons: Record<JobStatus, React.ReactNode> = {
  pending: <Clock className="w-3 h-3 mr-1" />,
  pendiente: <Clock className="w-3 h-3 mr-1" />,
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
  const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(null);

  // Regenerate Video Modal State
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [regenerateJobId, setRegenerateJobId] = useState<string | null>(null);
  const [regenerateBgUrl, setRegenerateBgUrl] = useState('');
  const [regenerateCustomBg, setRegenerateCustomBg] = useState('');
  const [regenerateUserPhotoUrl, setRegenerateUserPhotoUrl] = useState('');
  const [regenerateTitulo, setRegenerateTitulo] = useState('');
  const [regenerateArtista, setRegenerateArtista] = useState('');
  const [regenerateDedicatoria, setRegenerateDedicatoria] = useState('');
  const [regenerateDedicatoriaSize, setRegenerateDedicatoriaSize] = useState(28); 
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
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [customBackground, setCustomBackground] = useState('');
  const [userPhotoUrl, setUserPhotoUrl] = useState('');
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [dedicatoria, setDedicatoria] = useState('');
  const [dedicatoriaSize, setDedicatoriaSize] = useState(28); 
  const [studioTemplateConfig, setStudioTemplateConfig] = useState<TemplateConfig>({ ...DEFAULT_TEMPLATE, id: '' });
  
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
        toast.success('Plantilla guardada!');
        loadTemplates();
      } else {
        toast.error(`Error al guardar plantilla: ${data.statusMessage || data.message || 'Error desconocido'}`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Error al guardar: ${e.message || 'Error de red'}`);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!templateId) return toast.error("Error: ID inválido");
    
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
        setStudioTemplateConfig({ ...DEFAULT_TEMPLATE, id: '' });
        setBackgroundUrl('');
        setCustomBackground('');
      }
      
      if (regenerateTemplateConfig.id === templateId) {
        setRegenerateTemplateConfig({ ...DEFAULT_TEMPLATE, id: '' });
        setRegenerateBgUrl('');
        setRegenerateCustomBg('');
      }
      
      toast.success("Éxito: Plantilla eliminada permanentemente.");
    } catch (error: any) {
      console.error("Error UI:", error);
      toast.error(`Error al eliminar: ${error.message}`);
    }
  };
  
  // Studio Step 3
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [studioAudioUrl, setStudioAudioUrl] = useState<string | null>(null);
  const [studioVideoUrl, setStudioVideoUrl] = useState<string | null>(null);

  // Load Studio State from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('curseaDigitalStudioState');
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
    localStorage.setItem('curseaDigitalStudioState', JSON.stringify(stateToSave));
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
        toast.success('Video generado correctamente');
      } else {
        toast.error(`Failed to generate video: ${data.statusMessage || data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Network error occurred'}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateAudioFromHistory = async (job: MediaJob) => {
    setGeneratingAudioId(job.id);
    try {
      const res = await fetch('/api/manual/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: job.prompt, jobId: job.id })
      });
      
      if (res.ok) {
        fetchJobs();
        toast.success('Audio generado correctamente');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(`Error al generar audio: ${data.statusMessage || data.message || 'Error desconocido'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Error de red'}`);
    } finally {
      setGeneratingAudioId(null);
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
        toast.success('Audio generado');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al generar audio');
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
        toast.success('Video generado');
      } else {
        toast.error(`Error al generar video: ${data.statusMessage || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error: Network error occurred');
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
        toast.success('Enviado correctamente');
        handleResetStudio();
      } else {
        toast.error(`Error al enviar: ${data.statusMessage || data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Network error occurred'}`);
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
        toast.success('Enviado correctamente');
      } else {
        toast.error(`Error al enviar: ${data.statusMessage || data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Network error occurred'}`);
    } finally {
      setIsSendingWhatsapp(false);
    }
  };

  const handleResetStudio = () => {
    setStudioStep(1);
    setStudioJobId(null);
    setPrompt('');
    setBackgroundUrl('');
    setCustomBackground('');
    setUserPhotoUrl('');
    setTitulo('');
    setArtista('');
    setDedicatoria('');
    setPhone('');
    setStudioAudioUrl(null);
    setStudioVideoUrl(null);
    setStudioTemplateConfig({ ...DEFAULT_TEMPLATE, id: '' });
    localStorage.removeItem('curseaDigitalStudioState');
  };

  const renderTemplateSelector = (
    currentConfigId: string,
    setConfig: (config: TemplateConfig) => void,
    setBg: (bg: string) => void,
    setCustomBg: (bg: string) => void,
    setPhotoUrl: (url: string) => void,
    isProcessing: boolean,
    setDedicatoriaSizeState?: (size: number) => void
  ) => {
    const templatesWithBg = dbTemplates.filter(t => {
      const parsedConfig = (t as any).config || t;
      return parsedConfig.type !== 'coordenadas' && (parsedConfig.backgroundUrl || parsedConfig.bgUrl || t.bgUrl);
    });

    const templatesWithoutBg = dbTemplates.filter(t => {
      const parsedConfig = (t as any).config || t;
      return parsedConfig.type === 'coordenadas' || (!parsedConfig.backgroundUrl && !parsedConfig.bgUrl && !t.bgUrl);
    });

    const handleSelect = (t: any) => {
      const parsedConfig = (t as any).config || t;
      const configData = typeof parsedConfig === 'string' ? JSON.parse(parsedConfig) : parsedConfig;
      const isCoords = configData.type === 'coordenadas';
      
      if (!isCoords) {
        const bg = configData.backgroundUrl || configData.bgUrl || t.bgUrl;
        if (bg !== undefined) {
          const trimmedBg = String(bg).trim();
          setBg(trimmedBg);
          setCustomBg(trimmedBg);
        }
      }
      
      if (configData.photoUrl !== undefined) {
        setPhotoUrl(String(configData.photoUrl).trim());
      }
      
      const nextConfig = { ...JSON.parse(JSON.stringify(configData)), id: t.id };
      
      if (nextConfig.photoUrl !== undefined) {
        nextConfig.photoUrl = String(nextConfig.photoUrl).trim();
      }
      if (nextConfig.backgroundUrl !== undefined) {
        nextConfig.backgroundUrl = String(nextConfig.backgroundUrl).trim();
      }
      if (nextConfig.bgUrl !== undefined) {
        nextConfig.bgUrl = String(nextConfig.bgUrl).trim();
      }
      
      if (!nextConfig.dedicatoria) {
        nextConfig.dedicatoria = { ...DEFAULT_TEMPLATE.dedicatoria };
      }
      
      if (configData.dedicatoriaX !== undefined) nextConfig.dedicatoria.x = Number(configData.dedicatoriaX);
      else if (configData.dedicatoryX !== undefined) nextConfig.dedicatoria.x = Number(configData.dedicatoryX);

      if (configData.dedicatoriaY !== undefined) nextConfig.dedicatoria.y = Number(configData.dedicatoriaY);
      else if (configData.dedicatoryY !== undefined) nextConfig.dedicatoria.y = Number(configData.dedicatoryY);

      let dedicatoriaSz = nextConfig.dedicatoria.fontSize;
      if (configData.dedicatoriaSize !== undefined) dedicatoriaSz = Number(configData.dedicatoriaSize);
      else if (configData.dedicatorySize !== undefined) dedicatoriaSz = Number(configData.dedicatorySize);
      
      nextConfig.dedicatoria.fontSize = dedicatoriaSz;
      
      if (setDedicatoriaSizeState) {
        setDedicatoriaSizeState(dedicatoriaSz);
      }

      setConfig(nextConfig);
    };

    return (
      <div className="flex gap-2 mb-3">
        <DropdownMenu>
          <DropdownMenuTrigger disabled={isProcessing} className="flex items-center justify-between w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#8B1F32] focus:border-[#8B1F32] disabled:opacity-50 text-left h-12 shadow-sm">
            <span className="truncate">
              {currentConfigId
                ? dbTemplates.find(x => x.id === currentConfigId)?.name || 'Plantilla seleccionada'
                : "Seleccionar plantilla..."}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-neutral-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[320px] bg-white border-neutral-200 max-h-64 overflow-y-auto rounded-xl">
            {dbTemplates.length === 0 ? (
              <div className="p-4 text-sm text-neutral-500 text-center">No hay plantillas.</div>
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
                        onClick={() => handleSelect(t)}
                        className="flex items-center justify-between cursor-pointer py-2.5 px-3 text-neutral-800 hover:bg-[#F5EADC]/40 focus:bg-[#F5EADC]/40"
                      >
                        <div className="flex items-center truncate mr-2 w-full">
                          <Check className={`mr-2 h-4 w-4 shrink-0 text-[#8B1F32] ${currentConfigId === t.id ? "opacity-100" : "opacity-0"}`} />
                          <span className="truncate">{t.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteTemplate(t.id); }}
                          className="p-1.5 hover:bg-rose-100 text-neutral-400 hover:text-rose-600 rounded-md transition-colors shrink-0 z-10"
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                        onClick={() => handleSelect(t)}
                        className="flex items-center justify-between cursor-pointer py-2.5 px-3 text-neutral-800 hover:bg-[#F5EADC]/40 focus:bg-[#F5EADC]/40"
                      >
                        <div className="flex items-center truncate mr-2 w-full">
                          <Check className={`mr-2 h-4 w-4 shrink-0 text-[#8B1F32]/70 ${currentConfigId === t.id ? "opacity-100" : "opacity-0"}`} />
                          <span className="truncate">{t.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteTemplate(t.id); }}
                          className="p-1.5 hover:bg-rose-100 text-neutral-400 hover:text-rose-600 rounded-md transition-colors shrink-0 z-10"
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const renderConfigControls = (config: TemplateConfig, setConfig: any, key: 'titulo'|'artista'|'dedicatoria', extSizeState?: number, setExtSizeState?: any) => (
    <div className="flex gap-2 mt-2">
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-neutral-400 uppercase font-bold">X:</span>
        <input
          type="number"
          value={config[key].x === 'center' ? '' : config[key].x}
          onChange={(e) => setConfig({...config, [key]: {...config[key], x: Number(e.target.value), align: 'left'}})}
          className="w-16 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#8B1F32]"
          placeholder="Ctr"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-neutral-400 uppercase font-bold">Y:</span>
        <input
          type="number"
          value={config[key].y}
          onChange={(e) => setConfig({...config, [key]: {...config[key], y: Number(e.target.value)}})}
          className="w-16 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#8B1F32]"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-neutral-400 uppercase font-bold">Size:</span>
        <input
          type="number"
          value={extSizeState !== undefined ? extSizeState : config[key].fontSize}
          onChange={(e) => {
            const val = Number(e.target.value);
            setConfig({...config, [key]: {...config[key], fontSize: val}});
            if (setExtSizeState) setExtSizeState(val);
          }}
          className="w-16 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#8B1F32]"
        />
      </div>
    </div>
  );

  const renderPhotoControls = (config: TemplateConfig, setConfig: any) => (
    <div className="flex gap-2 mt-2">
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-neutral-400 uppercase font-bold">X:</span>
        <input
          type="number"
          value={config.photo.x}
          onChange={(e) => setConfig({...config, photo: {...config.photo, x: Number(e.target.value)}})}
          className="w-14 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#8B1F32]"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-neutral-400 uppercase font-bold">Y:</span>
        <input
          type="number"
          value={config.photo.y}
          onChange={(e) => setConfig({...config, photo: {...config.photo, y: Number(e.target.value)}})}
          className="w-14 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#8B1F32]"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-neutral-400 uppercase font-bold">W:</span>
        <input
          type="number"
          value={config.photo.w}
          onChange={(e) => setConfig({...config, photo: {...config.photo, w: Number(e.target.value)}})}
          className="w-14 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#8B1F32]"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-neutral-400 uppercase font-bold">H:</span>
        <input
          type="number"
          value={config.photo.h}
          onChange={(e) => setConfig({...config, photo: {...config.photo, h: Number(e.target.value)}})}
          className="w-14 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#8B1F32]"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5EADC] p-4 sm:p-8 font-sans selection:bg-[#8B1F32]/20 text-neutral-900">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#8B1F32] mb-1">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Platform Admin</span>
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Cursea Digital</h1>
          <p className="text-sm text-neutral-600">Gestión y control de producción musical.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="rounded-xl border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-[#8B1F32] transition-all"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex space-x-2 bg-white/50 p-1.5 rounded-2xl w-fit mb-10 border border-[#8B1F32]/10 shadow-sm">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'history' 
                ? 'bg-[#8B1F32] text-white shadow-lg shadow-[#8B1F32]/20' 
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/60'
            }`}
          >
            History & Control
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'studio' 
                ? 'bg-[#8B1F32] text-white shadow-lg shadow-[#8B1F32]/20' 
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/60'
            }`}
          >
            Manual Studio
          </button>
        </div>

        {/* Content */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-[#8B1F32]/10 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-neutral-50 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#8B1F32]" />
                <h2 className="text-lg font-bold">Media Jobs Historial</h2>
              </div>
              <button 
                onClick={fetchJobs}
                className="p-2.5 text-neutral-400 hover:text-[#8B1F32] bg-neutral-50 hover:bg-[#F5EADC]/40 rounded-xl transition-all shadow-sm"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Source</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Prompt / Info</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Media</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {jobs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-neutral-400 italic">
                        No se encontraron registros.
                      </td>
                    </tr>
                  )}
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-[#F5EADC]/10 transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap text-neutral-500 text-xs">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${
                          job.source === 'landing' ? 'bg-[#8B1F32]/10 text-[#8B1F32]' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {job.source === 'landing' ? 'LANDING' : 'STUDIO'}
                        </span>
                      </td>
                      <td className="px-6 py-5 max-w-xs truncate text-neutral-800 font-medium" title={job.prompt}>
                        {job.prompt}
                        {job.recipient && <div className="text-[10px] text-neutral-400 mt-1.5 flex items-center gap-1.5 font-bold uppercase"><Send className="w-3 h-3" /> To: {job.recipient}</div>}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[job.status]}`}>
                          {statusIcons[job.status]}
                          {job.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          {job.audioUrl && (
                            <div className="flex items-center gap-2 p-1.5 bg-neutral-50 rounded-xl border border-neutral-100">
                              <Music className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <audio controls className="h-7 w-full opacity-80" src={job.audioUrl}></audio>
                            </div>
                          )}
                          {job.videoUrl && (
                            <div className="flex items-center gap-2 p-1.5 bg-neutral-50 rounded-xl border border-neutral-100">
                              <Video className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <video className="h-10 w-16 bg-black rounded-lg object-cover" src={job.videoUrl}></video>
                              <button onClick={() => window.open(job.videoUrl || '', '_blank')} className="text-[10px] text-[#8B1F32] font-bold uppercase hover:underline">Ver Video</button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right space-x-2">
                        {job.prompt && !job.audioUrl && (
                          <button
                            onClick={() => handleGenerateAudioFromHistory(job)}
                            disabled={generatingAudioId === job.id}
                            className="p-2.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all shadow-sm disabled:opacity-50 border border-transparent hover:border-blue-100"
                            title="Generate Audio"
                          >
                            {generatingAudioId === job.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                          </button>
                        )}
                        {job.audioUrl && (
                          <button
                            onClick={() => {
                              setRegenerateJobId(job.id);
                              const bg = job.backgroundUrl || '';
                              setRegenerateBgUrl(bg);
                              setRegenerateCustomBg(bg);
                              setRegenerateUserPhotoUrl(job.userPhotoUrl || '');
                              setRegenerateTitulo(job.titulo || '');
                              setRegenerateArtista(job.artista || '');
                              setRegenerateDedicatoria(job.dedicatoria || '');
                              
                              let parsedConfig: any = null;
                              if (job.config) {
                                try {
                                  parsedConfig = typeof job.config === 'string' ? JSON.parse(job.config) : job.config;
                                  if (typeof parsedConfig === 'string') parsedConfig = JSON.parse(parsedConfig);
                                } catch(e) { console.error(e); }
                              }

                              if (parsedConfig) {
                                const dedSize = parsedConfig.dedicatoriaSize ?? parsedConfig.dedicatorySize ?? parsedConfig.dedicatoria?.fontSize ?? 28;
                                setRegenerateDedicatoriaSize(Number(dedSize));
                                const newConfig: TemplateConfig = {
                                  ...DEFAULT_TEMPLATE,
                                  id: parsedConfig.id || '',
                                  name: parsedConfig.name || 'Plantilla Cliente',
                                  bgUrl: parsedConfig.backgroundUrl || parsedConfig.bgUrl || bg,
                                  photo: {
                                    x: Number(parsedConfig.photoX ?? parsedConfig.photo?.x ?? 130),
                                    y: Number(parsedConfig.photoY ?? parsedConfig.photo?.y ?? 180),
                                    w: Number(parsedConfig.photoWidth ?? parsedConfig.photo?.w ?? 820),
                                    h: Number(parsedConfig.photoHeight ?? parsedConfig.photo?.h ?? 820)
                                  },
                                  titulo: {
                                    ...DEFAULT_TEMPLATE.titulo,
                                    x: parsedConfig.tituloX ?? parsedConfig.titulo?.x ?? 130,
                                    y: Number(parsedConfig.tituloY ?? parsedConfig.titulo?.y ?? 1040),
                                    fontSize: Number(parsedConfig.tituloSize ?? parsedConfig.titulo?.fontSize ?? 42)
                                  },
                                  artista: {
                                    ...DEFAULT_TEMPLATE.artista,
                                    x: parsedConfig.artistaX ?? parsedConfig.artista?.x ?? 130,
                                    y: Number(parsedConfig.artistaY ?? parsedConfig.artista?.y ?? 1095),
                                    fontSize: Number(parsedConfig.artistaSize ?? parsedConfig.artista?.fontSize ?? 30)
                                  },
                                  dedicatoria: {
                                    ...DEFAULT_TEMPLATE.dedicatoria,
                                    x: parsedConfig.dedicatoriaX ?? parsedConfig.dedicatoryX ?? parsedConfig.dedicatoria?.x ?? 540,
                                    y: Number(parsedConfig.dedicatoriaY ?? parsedConfig.dedicatoryY ?? parsedConfig.dedicatoria?.y ?? 1620),
                                    fontSize: Number(dedSize)
                                  }
                                };
                                setRegenerateTemplateConfig(newConfig);
                              } else {
                                setRegenerateTemplateConfig({ ...DEFAULT_TEMPLATE, id: '' });
                                setRegenerateDedicatoriaSize(28);
                              }
                              setIsRegenerateModalOpen(true);
                            }}
                            className="p-2.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                            title="Generate Video"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        )}
                        {job.videoUrl && (
                          <button
                            onClick={() => {
                              setWhatsappJobId(job.id);
                              setWhatsappModalPhone(job.whatsappNumber || job.recipient || '');
                              setIsWhatsappModalOpen(true);
                            }}
                            className="p-2.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-emerald-100"
                            title="Send via WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100"
                          title="Delete"
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
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Steps Column */}
            <div className="bg-white rounded-3xl border border-[#8B1F32]/10 p-8 shadow-xl space-y-10">
              <div className="flex justify-between items-center pb-6 border-b border-neutral-50">
                <div>
                  <h2 className="text-xl font-bold">Manual Studio</h2>
                  <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">Producción Paso a Paso</p>
                </div>
                {studioJobId && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleResetStudio}
                    className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-[#8B1F32]"
                  >
                    Reset & New Job
                  </Button>
                )}
              </div>
              
              {/* Step 1 */}
              <div className={`space-y-4 relative ${studioStep === 1 ? 'opacity-100 scale-100' : 'opacity-40 scale-[0.98] pointer-events-none'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    studioStep >= 1 ? 'bg-[#8B1F32] text-white shadow-lg shadow-[#8B1F32]/20' : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    1
                  </div>
                  <h3 className="text-md font-bold text-neutral-800">Generación de Audio</h3>
                </div>
                
                <div className="space-y-4 pl-11">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={studioStep !== 1 || isProcessing}
                    placeholder="Describe el estilo y letra para generar la canción..."
                    className="w-full rounded-2xl border-neutral-200 focus:ring-[#8B1F32] min-h-[120px] text-sm resize-none"
                  />
                  {studioStep === 1 && (
                    <Button
                      onClick={handleGenerateAudio}
                      disabled={!prompt || isProcessing}
                      className="w-full h-12 bg-[#8B1F32] hover:bg-[#731929] text-white rounded-xl shadow-lg shadow-[#8B1F32]/20 transition-all font-bold text-sm"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Mic2 className="w-4 h-4 mr-2" />}
                      Generar Audio
                    </Button>
                  )}
                  {studioAudioUrl && (
                    <div className="mt-4 p-4 bg-[#F5EADC]/20 rounded-2xl border border-[#8B1F32]/10">
                      <p className="text-[10px] font-bold uppercase text-[#8B1F32] tracking-widest mb-3">Audio Pre-Producido:</p>
                      <audio controls className="w-full h-8 opacity-90" src={studioAudioUrl}></audio>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className={`space-y-6 relative ${studioStep === 2 ? 'opacity-100 scale-100' : 'opacity-40 scale-[0.98] pointer-events-none'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    studioStep >= 2 ? 'bg-[#8B1F32] text-white shadow-lg shadow-[#8B1F32]/20' : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    2
                  </div>
                  <h3 className="text-md font-bold text-neutral-800">Renderizado de Video</h3>
                </div>
                
                <div className="space-y-5 pl-11">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Plantilla Visual</Label>
                    {renderTemplateSelector(
                      studioTemplateConfig.id,
                      setStudioTemplateConfig,
                      setBackgroundUrl,
                      setCustomBackground,
                      setUserPhotoUrl,
                      isProcessing,
                      setDedicatoriaSize
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">URL Fondo Reproductor</Label>
                    <Input
                      type="url"
                      value={backgroundUrl === 'custom' ? customBackground : backgroundUrl}
                      onChange={(e) => {
                        setBackgroundUrl('custom');
                        setCustomBackground(e.target.value);
                      }}
                      disabled={studioStep !== 2 || isProcessing}
                      placeholder="https://..."
                      className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] text-xs h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Portada Imagen</Label>
                    <Input
                      type="url"
                      value={userPhotoUrl}
                      onChange={(e) => setUserPhotoUrl(e.target.value)}
                      disabled={studioStep !== 2 || isProcessing}
                      placeholder="https://..."
                      className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] text-xs h-10"
                    />
                    {renderPhotoControls(studioTemplateConfig, setStudioTemplateConfig)}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Título</Label>
                      <Input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        disabled={studioStep !== 2 || isProcessing}
                        placeholder="Canción..."
                        className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] text-xs h-10"
                      />
                      {renderConfigControls(studioTemplateConfig, setStudioTemplateConfig, 'titulo')}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Artista</Label>
                      <Input
                        value={artista}
                        onChange={(e) => setArtista(e.target.value)}
                        disabled={studioStep !== 2 || isProcessing}
                        placeholder="Nombre..."
                        className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] text-xs h-10"
                      />
                      {renderConfigControls(studioTemplateConfig, setStudioTemplateConfig, 'artista')}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Dedicatoria Final</Label>
                    <Textarea
                      value={dedicatoria}
                      onChange={(e) => setDedicatoria(e.target.value)}
                      disabled={studioStep !== 2 || isProcessing}
                      placeholder="Mensaje corto..."
                      rows={2}
                      className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] text-xs resize-none"
                    />
                    {renderConfigControls(studioTemplateConfig, setStudioTemplateConfig, 'dedicatoria', dedicatoriaSize, setDedicatoriaSize)}
                  </div>

                  {studioStep === 2 && (
                    <Button
                      onClick={handleGenerateVideo}
                      disabled={(!userPhotoUrl || !titulo || !artista || (backgroundUrl === 'custom' && !customBackground)) || isProcessing}
                      className="w-full h-12 bg-[#8B1F32] hover:bg-[#731929] text-white rounded-xl shadow-lg shadow-[#8B1F32]/20 transition-all font-bold text-sm"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                      Generar Video
                    </Button>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className={`space-y-4 relative ${studioStep === 3 ? 'opacity-100 scale-100' : 'opacity-40 scale-[0.98] pointer-events-none'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    studioStep === 3 ? 'bg-[#8B1F32] text-white shadow-lg shadow-[#8B1F32]/20' : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    3
                  </div>
                  <h3 className="text-md font-bold text-neutral-800">Envío WhatsApp</h3>
                </div>
                
                <div className="space-y-4 pl-11">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={studioStep !== 3 || isProcessing}
                    placeholder="+34600000000"
                    className="rounded-xl border-neutral-200 focus:ring-[#8B1F32] text-sm h-12 font-mono"
                  />
                  {studioStep === 3 && (
                    <Button
                      onClick={handleSendWhatsapp}
                      disabled={!phone || isProcessing}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all font-bold text-sm"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Enviar Producto Final
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Column */}
            <div className="space-y-8 flex flex-col items-center">
              <div className="w-full max-w-[320px] bg-white p-3 rounded-[40px] shadow-2xl border border-neutral-100 relative group">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-50 mb-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[#8B1F32]" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Preview Studio</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-500">Live</span>
                  </div>
                </div>

                <div className="rounded-[32px] overflow-hidden bg-neutral-950 aspect-[9/16] shadow-inner relative">
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
                    scale={0.296}
                  />
                  <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 rounded-[32px]" />
                </div>
              </div>

              {/* Template Save Actions */}
              {studioStep === 2 && (
                <div className="bg-white/60 p-5 rounded-3xl border border-[#8B1F32]/10 shadow-sm w-full max-w-[320px] text-center space-y-3">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-[0.2em] block">Guardar Configuración</span>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleSaveTemplate(studioTemplateConfig, backgroundUrl === 'custom' ? customBackground : backgroundUrl, dedicatoriaSize, 'completa')}
                      className="text-xs font-bold text-[#8B1F32] hover:underline"
                    >
                      Diseño Completo
                    </button>
                    <span className="w-1 h-1 rounded-full bg-neutral-300" />
                    <button
                      onClick={() => handleSaveTemplate(studioTemplateConfig, backgroundUrl === 'custom' ? customBackground : backgroundUrl, dedicatoriaSize, 'coordenadas')}
                      className="text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:underline"
                    >
                      Solo Coords
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regenerate Video Modal */}
        <Dialog open={isRegenerateModalOpen} onOpenChange={setIsRegenerateModalOpen}>
          <DialogContent className="bg-[#F5EADC] border-none text-neutral-900 max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl p-0">
            <div className="flex flex-col md:flex-row h-full">
              {/* Form Side */}
              <div className="flex-1 p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif font-bold text-neutral-900 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-[#8B1F32]" />
                    Renderizado Especial
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Plantilla Base</Label>
                    {renderTemplateSelector(
                      regenerateTemplateConfig.id,
                      setRegenerateTemplateConfig,
                      setRegenerateBgUrl,
                      setRegenerateCustomBg,
                      setRegenerateUserPhotoUrl,
                      isRegenerating,
                      setRegenerateDedicatoriaSize
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Fondo (URL)</Label>
                      <Input
                        value={regenerateBgUrl === 'custom' ? regenerateCustomBg : regenerateBgUrl}
                        onChange={(e) => { setRegenerateBgUrl('custom'); setRegenerateCustomBg(e.target.value); }}
                        placeholder="https://..."
                        className="rounded-xl border-neutral-200 text-xs h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Portada (URL)</Label>
                      <Input
                        value={regenerateUserPhotoUrl}
                        onChange={(e) => setRegenerateUserPhotoUrl(e.target.value)}
                        placeholder="https://..."
                        className="rounded-xl border-neutral-200 text-xs h-10"
                      />
                    </div>
                  </div>
                  {renderPhotoControls(regenerateTemplateConfig, setRegenerateTemplateConfig)}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Título</Label>
                      <Input
                        value={regenerateTitulo}
                        onChange={(e) => setRegenerateTitulo(e.target.value)}
                        placeholder="Nombre..."
                        className="rounded-xl border-neutral-200 text-xs h-10"
                      />
                      {renderConfigControls(regenerateTemplateConfig, setRegenerateTemplateConfig, 'titulo')}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Artista</Label>
                      <Input
                        value={regenerateArtista}
                        onChange={(e) => setRegenerateArtista(e.target.value)}
                        placeholder="Artista..."
                        className="rounded-xl border-neutral-200 text-xs h-10"
                      />
                      {renderConfigControls(regenerateTemplateConfig, setRegenerateTemplateConfig, 'artista')}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Dedicatoria</Label>
                    <Textarea
                      value={regenerateDedicatoria}
                      onChange={(e) => setRegenerateDedicatoria(e.target.value)}
                      placeholder="Mensaje..."
                      rows={2}
                      className="rounded-xl border-neutral-200 text-xs resize-none"
                    />
                    {renderConfigControls(regenerateTemplateConfig, setRegenerateTemplateConfig, 'dedicatoria', regenerateDedicatoriaSize, setRegenerateDedicatoriaSize)}
                  </div>
                </div>

                <DialogFooter className="pt-6 border-t border-neutral-100 sm:justify-between">
                  <Button variant="ghost" onClick={() => setIsRegenerateModalOpen(false)} className="rounded-xl text-neutral-500 font-bold uppercase text-[10px] tracking-widest">Cancelar</Button>
                  <Button 
                    onClick={handleRegenerateVideo} 
                    disabled={isRegenerating}
                    className="rounded-xl bg-[#8B1F32] hover:bg-[#731929] text-white px-8 font-bold text-sm shadow-lg shadow-[#8B1F32]/20"
                  >
                    {isRegenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                    Comenzar Render
                  </Button>
                </DialogFooter>
              </div>

              {/* Preview Side */}
              <div className="bg-white p-8 flex flex-col items-center justify-center border-l border-neutral-50 w-full md:w-[320px]">
                <div className="w-[200px] h-[355px] rounded-[32px] overflow-hidden bg-neutral-950 shadow-2xl relative">
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
                    scale={0.185}
                  />
                </div>
                <div className="mt-8 text-center space-y-4">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Guardar Plantilla</span>
                  <div className="flex gap-4">
                    <button onClick={() => handleSaveTemplate(regenerateTemplateConfig, regenerateBgUrl === 'custom' ? regenerateCustomBg : regenerateBgUrl, regenerateDedicatoriaSize, 'completa')} className="text-[10px] font-bold text-[#8B1F32] hover:underline uppercase">Completa</button>
                    <button onClick={() => handleSaveTemplate(regenerateTemplateConfig, regenerateBgUrl === 'custom' ? regenerateCustomBg : regenerateBgUrl, regenerateDedicatoriaSize, 'coordenadas')} className="text-[10px] font-bold text-neutral-400 hover:text-neutral-900 hover:underline uppercase">Solo Coords</button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send WhatsApp Modal */}
        <Dialog open={isWhatsappModalOpen} onOpenChange={setIsWhatsappModalOpen}>
          <DialogContent className="bg-white border-none rounded-[32px] shadow-2xl p-8 max-w-sm text-neutral-900">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-500" />
                Enviar Producto
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">WhatsApp del Cliente</Label>
                <Input
                  type="tel"
                  value={whatsappModalPhone}
                  onChange={(e) => setWhatsappModalPhone(e.target.value)}
                  disabled={isSendingWhatsapp}
                  placeholder="+34..."
                  className="rounded-xl border-neutral-200 h-12 font-mono text-center"
                />
              </div>
              <Button
                onClick={handleSendWhatsappFromModal}
                disabled={!whatsappModalPhone || isSendingWhatsapp}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 font-bold transition-all"
              >
                {isSendingWhatsapp ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Confirmar Envío
              </Button>
              <Button variant="ghost" className="w-full text-neutral-400 font-bold uppercase text-[10px]" onClick={() => setIsWhatsappModalOpen(false)}>Cancelar</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
