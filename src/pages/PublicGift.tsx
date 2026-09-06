import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function PublicGift() {
  const { slug } = useParams<{ slug: string }>();
  const [gift, setGift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchGift = async () => {
      try {
        const res = await fetch(`/api/gifts/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setGift(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGift();
  }, [slug]);

  // Audio setup when envelope is opened
  const handleOpen = () => {
    setIsOpen(true);
    // Auto-play audio if there's a link (Simplified using native audio if we assume youtubeLink could just be an mp3, 
    // but since they might paste YouTube, in a real scenario we'd use a YT iframe API. 
    // For this demo, let's just pretend we use a soft ambient sound if it's not playable).
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log('Autoplay blocked', e));
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Cargando sorpresa...</div>;
  }

  if (error || !gift) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">404 - No se encontró el regalo.</div>;
  }

  const themeColors = {
    rose: 'bg-rose-50 text-rose-900',
    indigo: 'bg-indigo-50 text-indigo-900',
    amber: 'bg-amber-50 text-amber-900'
  };
  const themeAccent = {
    rose: 'text-rose-500',
    indigo: 'text-indigo-500',
    amber: 'text-amber-500'
  };
  const themeBgAccent = {
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500'
  };

  const currentTheme = gift.theme || 'rose';

  return (
    <div className={`min-h-screen relative overflow-hidden ${themeColors[currentTheme as keyof typeof themeColors]}`}>
      
      {/* Hidden Audio Element for Background Music */}
      {/* Fallback to a generic romantic song if it's a youtube link, since native audio can't play YT directly */}
      <audio 
        ref={audioRef} 
        src={gift.youtubeLink.includes('youtube.com') ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' : gift.youtubeLink} 
        loop
      />

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="envelope"
            exit={{ y: '-100vh', opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1a2e]"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="cursor-pointer"
              onClick={handleOpen}
            >
              <div className="relative w-64 h-48 bg-rose-200 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden border-4 border-rose-300">
                {/* Envelope Flap mock */}
                <div className="absolute top-0 w-0 h-0 border-l-[128px] border-l-transparent border-r-[128px] border-r-transparent border-t-[96px] border-t-rose-300 opacity-50 z-10"></div>
                <div className="flex flex-col items-center z-20">
                  <Heart className="w-16 h-16 text-rose-500 fill-rose-500 mb-4" />
                  <span className="font-bold text-rose-900">Toca para abrir</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`transition-opacity duration-1000 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Floating Audio Controls */}
        <button 
          onClick={toggleAudio}
          className="fixed top-6 right-6 z-40 p-3 bg-white/50 backdrop-blur-md rounded-full shadow-lg text-gray-800 hover:bg-white transition"
        >
          {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>

        <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={isOpen ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {gift.photos && gift.photos[0] && (
              <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-8 border-white shadow-2xl mb-8">
                <img src={gift.photos[0]} alt="Nosotros" className="w-full h-full object-cover" />
              </div>
            )}

            <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 ${themeAccent[currentTheme as keyof typeof themeAccent]}`}>
              {gift.names}
            </h1>
            
            {gift.startDate && (
              <p className="text-sm font-medium tracking-widest uppercase mb-12 opacity-60">
                Desde {new Date(gift.startDate).toLocaleDateString()}
              </p>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isOpen ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 1 }}
            className="w-full bg-white/70 backdrop-blur-lg p-8 md:p-12 rounded-3xl shadow-xl mb-12 text-left"
          >
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {gift.mainMessage}
            </p>
          </motion.div>

          {gift.qualities && gift.qualities.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={isOpen ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="w-full mb-16"
            >
              <h3 className="text-2xl font-bold mb-6">Lo que más me gusta de ti</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {gift.qualities.map((q: string, i: number) => (
                  <span 
                    key={i} 
                    className={`px-5 py-2 rounded-full text-white font-medium shadow-md ${themeBgAccent[currentTheme as keyof typeof themeBgAccent]}`}
                  >
                    {q}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Photos Carousel (Simple CSS Scroll Snap for lightweight implementation) */}
          {gift.photos && gift.photos.length > 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={isOpen ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 2 }}
              className="w-full mb-16"
            >
              <h3 className="text-2xl font-bold mb-6">Nuestros Momentos</h3>
              <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-6 px-4 custom-scrollbar">
                {gift.photos.map((url: string, idx: number) => (
                  <div key={idx} className="flex-none w-64 h-80 snap-center rounded-2xl overflow-hidden shadow-lg bg-gray-200">
                    <img src={url} alt={`Momento ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Interactive Final Question */}
          {gift.finalQuestionEnabled && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isOpen ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 2.5 }}
              className="mt-8 p-12 bg-white rounded-[3rem] shadow-2xl border-4 border-white w-full relative overflow-hidden"
            >
              <Heart className={`absolute -top-10 -right-10 w-48 h-48 opacity-10 ${themeAccent[currentTheme as keyof typeof themeAccent]}`} />
              <h3 className="text-3xl font-extrabold mb-8 relative z-10">¿Aceptas una nueva aventura conmigo?</h3>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 relative z-10">
                <button 
                  onClick={() => alert('¡Sabía que dirías que sí! ❤️')}
                  className="px-10 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-xl shadow-xl transition-transform transform hover:scale-110 w-full sm:w-auto"
                >
                  ¡SÍ, ACEPTO!
                </button>
                <motion.button 
                  whileHover={{ scale: 0.9, x: [0, -50, 50, -50, 0] }}
                  transition={{ duration: 0.5 }}
                  className="px-10 py-4 bg-gray-200 text-gray-500 rounded-full font-bold text-xl shadow-md w-full sm:w-auto"
                >
                  No
                </motion.button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
