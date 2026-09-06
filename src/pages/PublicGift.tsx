import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, Music, Volume2, VolumeX, CheckCircle2, MapPin, Ticket, Sparkles, Smile, Star } from 'lucide-react';

// Tipos basados en la estructura de DB
interface Gift {
  id: string;
  names: string;
  startDate: string;
  photos: string[];
  youtubeLink: string;
  mainMessage: string;
  qualities: string[];
  thingsToDo: string[];
  mapPins: string[];
  loveVouchers: string[];
  rouletteQuestions: string[];
  finalQuestionEnabled: boolean;
  theme: 'rose' | 'indigo' | 'amber';
}

const themeStyles = {
  rose: {
    bg: 'bg-gradient-to-b from-rose-50 to-pink-100',
    primary: 'text-rose-600',
    bgPrimary: 'bg-rose-500',
    card: 'bg-white/80',
    accent: 'rose'
  },
  indigo: {
    bg: 'bg-gradient-to-b from-indigo-50 to-blue-100',
    primary: 'text-indigo-600',
    bgPrimary: 'bg-indigo-500',
    card: 'bg-white/80',
    accent: 'indigo'
  },
  amber: {
    bg: 'bg-gradient-to-b from-amber-50 to-orange-100',
    primary: 'text-amber-600',
    bgPrimary: 'bg-amber-500',
    card: 'bg-white/80',
    accent: 'amber'
  }
};

export default function PublicGift() {
  const { slug } = useParams<{ slug: string }>();
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Estados interactivos
  const [usedCoupons, setUsedCoupons] = useState<number[]>([]);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

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

  const handleOpen = () => {
    // Animación de confeti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f43f5e', '#ec4899', '#8b5cf6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f43f5e', '#ec4899', '#8b5cf6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    setIsOpen(true);
    
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
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

  const getDaysTogether = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const handleNoHover = () => {
    setNoButtonPos({
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200
    });
  };

  const spinRoulette = () => {
    if (!gift?.rouletteQuestions || gift.rouletteQuestions.length === 0) return;
    setRouletteSpinning(true);
    setRouletteResult(null);
    
    let ticks = 0;
    const interval = setInterval(() => {
      setRouletteResult(gift.rouletteQuestions[Math.floor(Math.random() * gift.rouletteQuestions.length)]);
      ticks++;
      if (ticks > 20) {
        clearInterval(interval);
        setRouletteSpinning(false);
      }
    }, 100);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-serif">Cargando sorpresa...</div>;
  if (error || !gift) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 font-serif">404 - No se encontró el regalo.</div>;

  const style = themeStyles[gift.theme] || themeStyles.rose;
  const daysTogether = getDaysTogether(gift.startDate);

  // Extraer un ID de video de YouTube para el iframe de audio en caso de no ser un mp3 directo
  const isYoutube = gift.youtubeLink?.includes('youtube.com') || gift.youtubeLink?.includes('youtu.be');
  let youtubeId = '';
  if (isYoutube) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = gift.youtubeLink.match(regExp);
    youtubeId = match && match[2].length === 11 ? match[2] : '';
  }

  return (
    <div className={`min-h-screen font-sans ${style.bg} selection:${style.bgPrimary} selection:text-white`}>
      
      {/* Audio oculto */}
      {isYoutube && youtubeId ? (
        <iframe
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isOpen ? 1 : 0}&loop=1&playlist=${youtubeId}`}
          frameBorder="0"
          allow="autoplay"
          className="hidden"
        ></iframe>
      ) : (
        <audio 
          ref={audioRef} 
          src={gift.youtubeLink || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'} 
          loop 
        />
      )}

      {/* Control de Audio Flotante */}
      {isOpen && (
        <motion.button 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={toggleAudio}
          className={`fixed top-4 right-4 z-50 p-3 bg-white/50 backdrop-blur-md rounded-full shadow-lg ${style.primary} hover:bg-white transition-all`}
        >
          {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </motion.button>
      )}

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="opening-screen"
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${style.bg}`}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              onClick={handleOpen}
              className="cursor-pointer flex flex-col items-center group"
            >
              <div className={`relative w-40 h-40 ${style.bgPrimary} rounded-full shadow-2xl flex items-center justify-center overflow-hidden mb-6 group-hover:shadow-[0_0_40px_rgba(244,63,94,0.6)] transition-shadow`}>
                <Heart className="w-20 h-20 text-white fill-white" />
              </div>
              <p className={`font-serif text-2xl font-bold ${style.primary}`}>¡Tienes una sorpresa!</p>
              <p className="text-gray-500 mt-2">Toca el corazón para abrir</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor Principal Estilo Móvil */}
      <div className={`max-w-md mx-auto min-h-screen bg-white/30 backdrop-blur-3xl shadow-2xl overflow-hidden transition-opacity duration-1000 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* HÉROE / ENCABEZADO */}
        <div className="pt-20 pb-12 px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <Heart className={`w-12 h-12 ${style.primary} mx-auto mb-6 opacity-80`} />
            <h1 className={`font-serif text-5xl font-bold mb-4 ${style.primary} leading-tight`}>
              {gift.names}
            </h1>
            {daysTogether !== null && (
              <div className="inline-block px-4 py-2 bg-white/60 rounded-full shadow-sm">
                <p className="text-gray-600 font-medium tracking-wide text-sm">
                  {daysTogether} DÍAS JUNTOS
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* FOTOS (CARRUSEL) */}
        {gift.photos && gift.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="w-full mb-16 px-4"
          >
            <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-6 pt-2 custom-scrollbar">
              {gift.photos.map((url, idx) => (
                <div key={idx} className="flex-none w-72 h-96 snap-center rounded-[2rem] overflow-hidden shadow-xl bg-gray-200 border-4 border-white transform transition-transform hover:scale-[1.02]">
                  <img src={url} alt={`Momento ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CARTA / MENSAJE */}
        {gift.mainMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6 mb-16"
          >
            <div className={`p-8 rounded-[2rem] ${style.card} shadow-xl border border-white/50 relative`}>
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center">
                <Sparkles className={`w-6 h-6 ${style.primary}`} />
              </div>
              <p className="font-serif text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
                {gift.mainMessage}
              </p>
            </div>
          </motion.div>
        )}

        {/* CUALIDADES */}
        {gift.qualities && gift.qualities.length > 0 && (
          <div className="px-6 mb-16">
            <h3 className={`font-serif text-2xl font-bold mb-6 text-center ${style.primary}`}>Lo que amo de ti</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {gift.qualities.map((q, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`px-5 py-2.5 rounded-full text-white font-medium shadow-md ${style.bgPrimary} text-sm`}
                >
                  {q}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* BUCKET LIST / COSAS POR HACER */}
        {gift.thingsToDo && gift.thingsToDo.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6 mb-16"
          >
            <h3 className={`font-serif text-2xl font-bold mb-6 text-center ${style.primary}`}>Nuestra Lista</h3>
            <div className="space-y-3">
              {gift.thingsToDo.map((item, i) => (
                <div key={i} className={`flex items-center p-4 rounded-2xl ${style.card} shadow-sm border border-white/50`}>
                  <CheckCircle2 className={`w-6 h-6 ${style.primary} mr-4 opacity-50`} />
                  <span className="text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* LUGARES ESPECIALES */}
        {gift.mapPins && gift.mapPins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6 mb-16"
          >
            <h3 className={`font-serif text-2xl font-bold mb-6 text-center ${style.primary}`}>Nuestros Lugares</h3>
            <div className="grid grid-cols-2 gap-4">
              {gift.mapPins.map((place, i) => (
                <div key={i} className={`p-4 rounded-3xl ${style.card} shadow-md text-center flex flex-col items-center border border-white/50`}>
                  <div className={`w-10 h-10 rounded-full ${style.bgPrimary} text-white flex items-center justify-center mb-3 shadow-inner`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm">{place}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* VALES DE AMOR */}
        {gift.loveVouchers && gift.loveVouchers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6 mb-16"
          >
            <h3 className={`font-serif text-2xl font-bold mb-6 text-center ${style.primary}`}>Vales Canjeables</h3>
            <div className="space-y-4">
              {gift.loveVouchers.map((voucher, i) => {
                const isUsed = usedCoupons.includes(i);
                return (
                  <div 
                    key={i} 
                    className={`relative p-6 rounded-2xl border-2 border-dashed transition-all duration-500 overflow-hidden cursor-pointer
                      ${isUsed ? 'bg-gray-100 border-gray-300 opacity-60' : `${style.card} border-${style.accent}-300 shadow-md hover:shadow-lg`}
                    `}
                    onClick={() => {
                      if (!isUsed) {
                        confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
                        setUsedCoupons([...usedCoupons, i]);
                      }
                    }}
                  >
                    {isUsed && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] z-10">
                        <span className="text-gray-800 font-bold text-xl uppercase tracking-widest rotate-[-15deg] border-4 border-gray-800 px-4 py-1 rounded-lg">USADO</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Ticket className={`w-8 h-8 ${isUsed ? 'text-gray-400' : style.primary} mr-4`} />
                      <div>
                        <h4 className="font-bold text-gray-800">Vale por:</h4>
                        <p className="text-gray-600 text-sm mt-1">{voucher}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* RULETA INTERACTIVA */}
        {gift.rouletteQuestions && gift.rouletteQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6 mb-20"
          >
            <h3 className={`font-serif text-2xl font-bold mb-6 text-center ${style.primary}`}>Ruleta del Destino</h3>
            <div className={`p-8 rounded-[3rem] ${style.card} shadow-xl border border-white/50 text-center flex flex-col items-center`}>
              <div className={`w-32 h-32 rounded-full border-8 border-white shadow-inner flex items-center justify-center mb-6 transition-transform duration-700 ${rouletteSpinning ? 'rotate-[1440deg] scale-90' : 'rotate-0 scale-100'} ${style.bgPrimary}`}>
                <Star className={`w-12 h-12 text-white ${rouletteSpinning ? 'animate-pulse' : ''}`} />
              </div>
              
              <div className="h-20 flex items-center justify-center w-full px-4 mb-4">
                <p className="font-medium text-gray-700 text-lg">
                  {rouletteResult || (rouletteSpinning ? 'Pensando...' : '¿Qué haremos hoy?')}
                </p>
              </div>

              <button 
                onClick={spinRoulette}
                disabled={rouletteSpinning}
                className={`px-8 py-3 rounded-full text-white font-bold tracking-wide shadow-lg transition-transform ${rouletteSpinning ? 'bg-gray-400' : `${style.bgPrimary} hover:scale-105 active:scale-95`}`}
              >
                GIRAR RULETA
              </button>
            </div>
          </motion.div>
        )}

        {/* PREGUNTA FINAL */}
        {gift.finalQuestionEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="px-6 pb-32"
          >
            <div className="p-10 bg-white rounded-[3rem] shadow-2xl text-center relative overflow-hidden">
              <Heart className={`absolute -top-10 -right-10 w-40 h-40 opacity-10 ${style.primary}`} />
              <Heart className={`absolute -bottom-10 -left-10 w-40 h-40 opacity-10 ${style.primary}`} />
              
              <h3 className="font-serif text-3xl font-extrabold mb-8 text-gray-800 relative z-10 leading-tight">
                ¿Aceptas continuar esta aventura juntos?
              </h3>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 relative z-10 h-32">
                <button 
                  onClick={() => {
                    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
                    alert('¡Sabía que dirías que sí! ❤️ Te amo.');
                  }}
                  className={`px-10 py-4 ${style.bgPrimary} text-white rounded-full font-bold text-xl shadow-xl transition-transform hover:scale-110 active:scale-95 w-40 z-20`}
                >
                  ¡SÍ!
                </button>
                
                <motion.button
                  animate={noButtonPos}
                  onHoverStart={handleNoHover}
                  onClick={handleNoHover}
                  className="px-10 py-4 bg-gray-200 text-gray-500 rounded-full font-bold text-xl shadow-md w-40 absolute sm:relative sm:ml-4"
                >
                  No
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Footer */}
        <div className="pb-8 text-center opacity-50">
          <Smile className="w-5 h-5 mx-auto mb-2 text-gray-500" />
          <p className="text-xs font-medium text-gray-500 tracking-widest uppercase">Hecho con mucho amor</p>
        </div>

      </div>
    </div>
  );
}
