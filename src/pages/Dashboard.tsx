import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Play, Settings, RefreshCw, Trash2, CheckCircle2, Clock, AlertCircle, Video, Music, Send, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  photo: { x: number; y: number; w: number; h: number };
  titulo: { x: number; y: number; fontSize: number; color: string; align: 'left' | 'center' };
  artista: { x: number; y: number; fontSize: number; color: string; align: 'left' | 'center' };
  dedicatoria: { x: number; y: number; fontSize: number; color: string; align: 'left' | 'center' };
}

export const TEMPLATES_CONFIG: Record<string, TemplateConfig> = {
  spotify: {
    id: 'spotify',
    name: 'Plantilla Spotify',
    bgUrl: 'image_f840ac.jpg',
    photo: { x: 130, y: 180, w: 820, h: 820 },
    titulo: { x: 130, y: 1040, fontSize: 42, color: 'white', align: 'left' },
    artista: { x: 130, y: 1095, fontSize: 30, color: '#B3B3B3', align: 'left' },
    dedicatoria: { x: 540, y: 1620, fontSize: 28, color: '#E5E5E5', align: 'center' },
  },
  apple: {
    id: 'apple',
    name: 'Plantilla Apple',
    bgUrl: 'image_apple.jpg',
    photo: { x: 130, y: 180, w: 820, h: 820 },
    titulo: { x: 540, y: 1040, fontSize: 42, color: 'white', align: 'center' },
    artista: { x: 540, y: 1095, fontSize: 30, color: '#CCCCCC', align: 'center' },
    dedicatoria: { x: 540, y: 1620, fontSize: 28, color: 'white', align: 'center' },
  },
  custom: {
    id: 'custom',
    name: 'Fondo Propio',
    bgUrl: 'custom',
    photo: { x: 130, y: 180, w: 820, h: 820 },
    titulo: { x: 130, y: 1040, fontSize: 42, color: 'white', align: 'left' },
    artista: { x: 130, y: 1095, fontSize: 30, color: '#B3B3B3', align: 'left' },
    dedicatoria: { x: 540, y: 1620, fontSize: 28, color: '#E5E5E5', align: 'center' },
  }
};

const LivePreviewEditor = ({ config, setConfig, backgroundUrl, customBackground, userPhotoUrl, titulo, artista, dedicatoria, scale }: any) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElement] = React.useState<string | null>(null);

  const renderTextNode = (key: 'titulo'|'artista'|'dedicatoria', text: string, placeholder: string) => {
    const t = config[key];
    const isSelected = selectedElement === key;
    const isCenter = t.align === 'center';

    return (
      <motion.div
        drag={isCenter ? "y" : true}
        dragMomentum={false}
        dragConstraints={containerRef}
        onDragStart={() => setSelectedElement(key)}
        onDragEnd={(e, info) => {
          const newX = isCenter ? t.x : t.x + (info.offset.x / scale);
          const newY = t.y + (info.offset.y / scale);
          setConfig((prev: any) => ({
            ...prev,
            [key]: { ...t, x: Math.round(newX), y: Math.round(newY) }
          }));
        }}
        animate={{ x: isCenter ? 0 : t.x, y: t.y }}
        onClick={(e: any) => { e.stopPropagation(); setSelectedElement(key); }}
        className={`absolute whitespace-nowrap cursor-move ${isSelected ? 'ring-4 ring-indigo-500/50 rounded-lg' : ''}`}
        style={{
          fontSize: `${t.fontSize}px`,
          color: t.color,
          textAlign: t.align,
          width: isCenter ? '1080px' : 'auto',
          zIndex: isSelected ? 50 : 10
        }}
      >
        {isSelected && (
          <div className="absolute -top-[130px] left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 p-4 rounded-2xl flex items-center gap-6 shadow-2xl cursor-default" onClick={(e: any) => e.stopPropagation()}>
            <div className="flex flex-col gap-2">
              <label className="text-[24px] text-gray-400 font-medium">Size</label>
              <input type="number" value={t.fontSize} onChange={e => setConfig((prev: any) => ({...prev, [key]: {...t, fontSize: Number(e.target.value)}}))} className="w-32 text-[32px] bg-gray-800 text-white rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[24px] text-gray-400 font-medium">Color</label>
              <input type="color" value={t.color} onChange={e => setConfig((prev: any) => ({...prev, [key]: {...t, color: e.target.value}}))} className="w-24 h-[52px] rounded-lg cursor-pointer bg-transparent" />
            </div>
          </div>
        )}
        {text || placeholder}
      </motion.div>
    );
  };

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl shrink-0" onClick={() => setSelectedElement(null)}>
      <div
        ref={containerRef}
        className="absolute top-0 left-0 w-[1080px] h-[1920px] origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        {backgroundUrl !== 'custom' ? (
          <img src={`/media/${backgroundUrl}`} className="w-full h-full object-cover" />
        ) : customBackground ? (
          <img src={customBackground} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )}

        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={containerRef}
          onDragStart={() => setSelectedElement('photo')}
          onDragEnd={(e, info) => {
            setConfig((prev: any) => ({ ...prev, photo: { ...prev.photo, x: Math.round(prev.photo.x + info.offset.x / scale), y: Math.round(prev.photo.y + info.offset.y / scale) }}));
          }}
          animate={{ x: config.photo.x, y: config.photo.y }}
          onClick={(e: any) => { e.stopPropagation(); setSelectedElement('photo'); }}
          className={`absolute group ${selectedElement === 'photo' ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-transparent' : ''}`}
          style={{ width: config.photo.w, height: config.photo.h, zIndex: 20 }}
        >
          {userPhotoUrl ? (
            <img src={userPhotoUrl} className="w-full h-full object-cover rounded-md shadow-2xl" />
          ) : (
            <div className="w-full h-full bg-gray-800/80 backdrop-blur flex flex-col items-center justify-center text-gray-400 rounded-md border-2 border-dashed border-gray-600">
              <ImageIcon className="w-32 h-32 mb-4" />
              <span className="text-3xl font-medium">Cover Photo</span>
            </div>
          )}

          {selectedElement === 'photo' && (
            <motion.div
              drag
              dragMomentum={false}
              onPointerDownCapture={(e: any) => e.stopPropagation()}
              onDrag={(e, info) => {
                const newW = Math.max(200, config.photo.w + info.delta.x / scale);
                const newH = Math.max(200, config.photo.h + info.delta.y / scale);
                setConfig((prev: any) => ({ ...prev, photo: { ...prev.photo, w: Math.round(newW), h: Math.round(newH) }}));
              }}
              className="absolute -bottom-8 -right-8 w-16 h-16 bg-indigo-600 rounded-full cursor-nwse-resize shadow-[0_0_30px_rgba(0,0,0,0.5)] border-[6px] border-white z-50 flex items-center justify-center hover:scale-110 transition-transform"
            >
              <div className="w-6 h-6 border-b-4 border-r-4 border-white translate-x-[-4px] translate-y-[-4px]" />
            </motion.div>
          )}
        </motion.div>

        {renderTextNode('titulo', titulo, 'Título de Canción')}
        {renderTextNode('artista', artista, 'Nombre del Artista')}
        {renderTextNode('dedicatoria', dedicatoria, 'Mensaje de dedicatoria...')}
      </div>
    </div>
  );
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
  const [regenerateTemplateConfig, setRegenerateTemplateConfig] = useState<TemplateConfig>(TEMPLATES_CONFIG.spotify);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
  const [studioTemplateConfig, setStudioTemplateConfig] = useState<TemplateConfig>(TEMPLATES_CONFIG.spotify);
  
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

  const handleSaveTemplate = async (config: TemplateConfig, bgUrl: string) => {
    const name = window.prompt('Nombre de la nueva plantilla:');
    if (!name) return;
    try {
      const res = await fetch('/api/templates/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, bgUrl, config })
      });
      if (res.ok) {
        alert('Plantilla guardada!');
        loadTemplates();
      } else {
        alert('Error al guardar plantilla.');
      }
    } catch (e) {
      console.error(e);
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
      phone,
      studioAudioUrl,
      studioVideoUrl,
    };
    localStorage.setItem('videoFlowStudioState', JSON.stringify(stateToSave));
  }, [
    studioStep, studioJobId, prompt, backgroundUrl, customBackground, 
    userPhotoUrl, titulo, artista, dedicatoria, phone, studioAudioUrl, studioVideoUrl
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
    setStudioTemplateConfig(TEMPLATES_CONFIG.spotify);
    localStorage.removeItem('videoFlowStudioState');
  };

  const renderConfigControls = (config: TemplateConfig, setConfig: any, key: 'titulo'|'artista'|'dedicatoria') => (
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
          value={config[key].fontSize}
          onChange={(e) => setConfig({...config, [key]: {...config[key], fontSize: Number(e.target.value)}})}
          className="w-16 px-2 py-1 bg-[#1A2333] border border-gray-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      {Object.values(TEMPLATES_CONFIG).map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (studioStep === 2 && !isProcessing) {
                              setBackgroundUrl(t.bgUrl);
                              setStudioTemplateConfig(JSON.parse(JSON.stringify(t)));
                            }
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center ${backgroundUrl === t.bgUrl ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 bg-[#1F2937] hover:border-gray-500'}`}
                        >
                          <span className="text-sm font-medium text-white text-center">{t.name}</span>
                        </div>
                      ))}
                      {dbTemplates.map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (studioStep === 2 && !isProcessing) {
                              setBackgroundUrl(t.bgUrl || 'custom');
                              if (t.bgUrl && t.bgUrl.startsWith('http')) setCustomBackground(t.bgUrl);
                              setStudioTemplateConfig(JSON.parse(JSON.stringify(t)));
                            }
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center ${studioTemplateConfig.id === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-[#1F2937] hover:border-gray-500'}`}
                        >
                          <span className="text-sm font-medium text-purple-200 text-center">{t.name}</span>
                        </div>
                      ))}
                    </div>
                    {backgroundUrl === 'custom' && (
                      <input
                        type="url"
                        value={customBackground}
                        onChange={(e) => setCustomBackground(e.target.value)}
                        disabled={studioStep !== 2 || isProcessing}
                        placeholder="URL de fondo personalizado (ej. https://...)"
                        className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      />
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
                    {renderConfigControls(studioTemplateConfig, setStudioTemplateConfig, 'dedicatoria')}
                  </div>

                  {/* Live Preview */}
                  <div className="mt-6 flex flex-col items-center">
                    <p className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Live Preview Editor</p>
                    <div className="w-[280px] h-[497.77px]">
                      <LivePreviewEditor
                        config={studioTemplateConfig}
                        setConfig={setStudioTemplateConfig}
                        backgroundUrl={backgroundUrl}
                        customBackground={customBackground}
                        userPhotoUrl={userPhotoUrl}
                        titulo={titulo}
                        artista={artista}
                        dedicatoria={dedicatoria}
                        scale={0.259259}
                      />
                    </div>
                  </div>

                  {/* Live Preview Save Button */}
                  {studioStep === 2 && (
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => handleSaveTemplate(studioTemplateConfig, backgroundUrl === 'custom' ? customBackground : backgroundUrl)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Guardar Diseño como Plantilla
                      </button>
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
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {Object.values(TEMPLATES_CONFIG).map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (!isRegenerating) {
                            setRegenerateBgUrl(t.bgUrl);
                            setRegenerateTemplateConfig(JSON.parse(JSON.stringify(t)));
                          }
                        }}
                        className={`p-2 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center ${regenerateBgUrl === t.bgUrl ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 bg-[#1F2937] hover:border-gray-500'}`}
                      >
                        <span className="text-xs font-medium text-white text-center">{t.name}</span>
                      </div>
                    ))}
                    {dbTemplates.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (!isRegenerating) {
                            setRegenerateBgUrl(t.bgUrl || 'custom');
                            if (t.bgUrl && t.bgUrl.startsWith('http')) setRegenerateCustomBg(t.bgUrl);
                            setRegenerateTemplateConfig(JSON.parse(JSON.stringify(t)));
                          }
                        }}
                        className={`p-2 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center ${regenerateTemplateConfig.id === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-[#1F2937] hover:border-gray-500'}`}
                      >
                        <span className="text-xs font-medium text-purple-200 text-center">{t.name}</span>
                      </div>
                    ))}
                  </div>
                  {regenerateBgUrl === 'custom' && (
                    <input
                      type="url"
                      value={regenerateCustomBg}
                      onChange={(e) => setRegenerateCustomBg(e.target.value)}
                      disabled={isRegenerating}
                      placeholder="URL de fondo personalizado..."
                      className="w-full px-3 py-2 text-sm bg-[#1F2937] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
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
                  {renderConfigControls(regenerateTemplateConfig, setRegenerateTemplateConfig, 'dedicatoria')}
                </div>
              </div>

              {/* Live Preview Col */}
              <div className="shrink-0 flex flex-col items-center justify-center">
                <p className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Live Preview Editor</p>
                <div className="w-[220px] h-[391.11px]">
                  <LivePreviewEditor
                    config={regenerateTemplateConfig}
                    setConfig={setRegenerateTemplateConfig}
                    backgroundUrl={regenerateBgUrl}
                    customBackground={regenerateCustomBg}
                    userPhotoUrl={regenerateUserPhotoUrl}
                    titulo={regenerateTitulo}
                    artista={regenerateArtista}
                    dedicatoria={regenerateDedicatoria}
                    scale={0.2037}
                  />
                </div>
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => handleSaveTemplate(regenerateTemplateConfig, regenerateBgUrl === 'custom' ? regenerateCustomBg : regenerateBgUrl)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Guardar Diseño como Plantilla
                  </button>
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
      </div>
    </div>
  );
}
