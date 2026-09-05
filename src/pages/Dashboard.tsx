import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Play, Settings, RefreshCw, Trash2, CheckCircle2, Clock, AlertCircle, Video, Music } from 'lucide-react';
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
  const [regenerateImageUrl, setRegenerateImageUrl] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Studio state
  const [studioStep, setStudioStep] = useState(1);
  const [studioJobId, setStudioJobId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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
        if (parsed.imageUrl) setImageUrl(parsed.imageUrl);
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
      imageUrl,
      phone,
      studioAudioUrl,
      studioVideoUrl,
    };
    localStorage.setItem('videoFlowStudioState', JSON.stringify(stateToSave));
  }, [studioStep, studioJobId, prompt, imageUrl, phone, studioAudioUrl, studioVideoUrl]);

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
    if (!regenerateJobId || !regenerateImageUrl) return;
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/manual/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: regenerateJobId, imageUrl: regenerateImageUrl })
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
    if (!imageUrl || !studioJobId) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/manual/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: studioJobId, imageUrl })
      });
      const data = await res.json();
      if (data.job) {
        setStudioVideoUrl(data.job.videoUrl);
        setStudioStep(3);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendWhatsapp = async () => {
    if (!phone || !studioJobId) return;
    setIsProcessing(true);
    try {
      await fetch('/api/manual/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: studioJobId, recipient: phone })
      });
      alert('Sent successfully!');
      handleResetStudio();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetStudio = () => {
    setStudioStep(1);
    setStudioJobId(null);
    setPrompt('');
    setImageUrl('');
    setPhone('');
    setStudioAudioUrl(null);
    setStudioVideoUrl(null);
    localStorage.removeItem('videoFlowStudioState');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#111827] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30">
                <Settings className="w-5 h-5 text-blue-400 absolute opacity-50" />
                <Play className="w-4 h-4 text-indigo-400 fill-indigo-400 z-10 ml-0.5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">VideoFlow</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                              setRegenerateImageUrl(job.imageUrl || '');
                              setIsRegenerateModalOpen(true);
                            }}
                            className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors inline-block"
                            title="Generate or Regenerate Video"
                          >
                            <Video className="w-4 h-4" />
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
                
                <h3 className="text-lg font-medium text-white mb-4">Generate Video (FFmpeg)</h3>
                <div className="space-y-4">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={studioStep !== 2 || isProcessing}
                    placeholder="Enter image URL (e.g. https://example.com/image.jpg)"
                    className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  {studioStep === 2 && (
                    <button
                      onClick={handleGenerateVideo}
                      disabled={!imageUrl || isProcessing}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                      Generate Video
                    </button>
                  )}
                  {studioVideoUrl && (
                    <div className="mt-4 p-4 bg-[#171F2E] rounded-xl border border-gray-800">
                      <p className="text-sm text-gray-400 mb-2">Generated Video:</p>
                      <video controls className="w-full max-h-64 bg-black rounded-lg" src={studioVideoUrl}></video>
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
          <DialogContent className="bg-[#111827] border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Generate/Regenerate Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-400">Provide an image URL to combine with the existing audio track.</p>
              <input
                type="url"
                value={regenerateImageUrl}
                onChange={(e) => setRegenerateImageUrl(e.target.value)}
                disabled={isRegenerating}
                placeholder="Enter image URL..."
                className="w-full px-4 py-3 bg-[#1F2937] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
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
                disabled={!regenerateImageUrl || isRegenerating}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
              >
                {isRegenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                Generate
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
