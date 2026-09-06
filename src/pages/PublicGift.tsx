import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, Music, Volume2, VolumeX, CheckCircle2, Ticket, Sparkles, Smile, MapPin } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Tipos basados en la estructura de la base de datos
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
    bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100',
    primary: 'text-rose-600',
    bgPrimary: 'bg-rose-500',
    card: 'bg-white/70 backdrop-blur-md',
    accent: 'rose'
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100',
    primary: 'text-indigo-600',
    bgPrimary: 'bg-indigo-500',
    card: 'bg-white/70 backdrop-blur-md',
    accent: 'indigo'
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100',
    primary: 'text-amber-600',
    bgPrimary: 'bg-amber-500',
    card: 'bg-white/70 backdrop-blur-md',
    accent: 'amber'
  }
};

export default function PublicGift() {
  const { slug } = useParams<{ slug: string }>();
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Estados de interacción
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [usedCoupons, setUsedCoupons] = useState<number[]>([]);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  
  // Ruleta
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

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
    // Explosión de confeti principal
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#fcd34d']
    });

    setIsOpen(true);
    
    // Iniciar audio
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
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
    // Evadir de forma aleatoria el botón "No"
    const maxOffset = 120;
    setNoButtonPos({
      x: (Math.random() - 0.5) * maxOffset * 2,
      y: (Math.random() - 0.5) * maxOffset * 2
    });
  };

  const spinRoulette = () => {
    if (!gift?.rouletteQuestions || gift.rouletteQuestions.length === 0 || rouletteSpinning) return;
    
    setRouletteSpinning(true);
    setRouletteResult(null);
    
    // Dar varias vueltas completas (ej. 5 vueltas = 1800 grados) + un ángulo aleatorio extra
    const extraDegrees = Math.floor(Math.random() * 360);
    const newRotation = rotation + 1800 + extraDegrees;
    setRotation(newRotation);

    setTimeout(() => {
      const selected = gift.rouletteQuestions[Math.floor(Math.random() * gift.rouletteQuestions.length)];
      setRouletteResult(selected);
      setRouletteSpinning(false);
      
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.7 }
      });
    }, 3000); // 3 segundos de rotación
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-serif">Cargando sorpresa...</div>;
  if (error || !gift) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 font-serif">404 - No se encontró el regalo.</div>;

  const style = themeStyles[gift.theme] || themeStyles.rose;
  const daysTogether = getDaysTogether(gift.startDate);

  // Mapear los datos de DB a las variables solicitadas
  const coupleNames = gift.names;
  const message = gift.mainMessage;
  const bucketList = gift.thingsToDo;
  const coupons = gift.loveVouchers;
  const roulette = gift.rouletteQuestions;
  const finalQuestion = gift.finalQuestionEnabled;

  // Lógica de Audio Background
  const isYoutube = gift.youtubeLink?.includes('youtube.com') || gift.youtubeLink?.includes('youtu.be');
  let youtubeId = '';
  if (isYoutube) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = gift.youtubeLink.match(regExp);
    youtubeId = match && match[2].length === 11 ? match[2] : '';
  }

  // Variantes de animación
  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className={`w-full min-h-screen font-sans ${style.bg} selection:${style.bgPrimary} selection:text-white`}>
      
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
      <AnimatePresence>
        {isOpen && (
          <motion.button 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={toggleAudio}
            className={`fixed top-4 right-4 z-50 p-3 bg-white/60 backdrop-blur-md rounded-full shadow-lg ${style.primary} hover:bg-white hover:scale-105 transition-all`}
          >
            {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* PANTALLA INICIAL (EL SOBRE) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="opening-screen"
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${style.bg} overflow-hidden`}
          >
            {/* Elementos decorativos de fondo */}
            <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[100px] opacity-40 ${style.bgPrimary}`}></div>
            <div className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[100px] opacity-40 ${style.bgPrimary}`}></div>

            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className={`relative flex items-center justify-center w-32 h-32 rounded-full ${style.bgPrimary} shadow-2xl shadow-${style.accent}-500/50 mb-10 z-10`}
            >
              <Heart className="w-16 h-16 text-white fill-white" />
            </motion.div>
            
            <h2 className={`font-serif text-3xl font-bold mb-8 z-10 ${style.primary}`}>Para mi persona favorita</h2>
            
            <button
              onClick={handleOpen}
              className={`px-10 py-4 rounded-full text-white font-bold text-lg tracking-wide shadow-xl ${style.bgPrimary} transition-transform hover:scale-105 active:scale-95 z-10`}
            >
              Abrir Regalo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENEDOR MÓVIL PRINCIPAL */}
      <div className={`max-w-md mx-auto w-full min-h-screen relative overflow-hidden transition-opacity duration-1000 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* ENCABEZADO */}
        <div className="pt-24 pb-12 px-6 flex flex-col items-center text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={sectionVariants}
          >
            <Sparkles className={`w-10 h-10 ${style.primary} mx-auto mb-6 opacity-80`} />
            <h1 className={`font-serif text-5xl font-extrabold mb-4 ${style.primary} leading-tight drop-shadow-sm`}>
              {coupleNames}
            </h1>
            {daysTogether !== null && (
              <div className="mt-4 inline-block px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white">
                <p className={`font-bold tracking-widest text-xs uppercase ${style.primary}`}>
                  {daysTogether} Días Juntos ❤️
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* CARRUSEL DE FOTOS (Shadcn UI) */}
        {gift.photos && gift.photos.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={sectionVariants}
            className="w-full px-6 mb-20"
          >
            <Carousel className="w-full relative">
              <CarouselContent>
                {gift.photos.map((url, idx) => (
                  <CarouselItem key={idx}>
                    <div className="p-1">
                      <div className="rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] bg-gray-200">
                        <img src={url} alt={`Momento ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {gift.photos.length > 1 && (
                <>
                  <div className="absolute top-1/2 -translate-y-1/2 left-4">
                    <CarouselPrevious className="relative h-10 w-10 border-none bg-white/80 backdrop-blur shadow-md text-gray-800 hover:bg-white" />
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-4">
                    <CarouselNext className="relative h-10 w-10 border-none bg-white/80 backdrop-blur shadow-md text-gray-800 hover:bg-white" />
                  </div>
                </>
              )}
            </Carousel>
          </motion.div>
        )}

        {/* CARTA / MENSAJE */}
        {message && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={sectionVariants}
            className="px-6 mb-20"
          >
            <div className={`p-8 md:p-10 rounded-[2.5rem] ${style.card} shadow-xl border border-white relative overflow-hidden`}>
              {/* Sutil gradiente sobre la carta */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl"></div>
              
              <Heart className={`w-8 h-8 ${style.primary} mb-6 fill-current opacity-20`} />
              <p className="font-serif text-lg md:text-xl leading-relaxed text-gray-800 whitespace-pre-wrap relative z-10">
                {message}
              </p>
            </div>
          </motion.div>
        )}

        {/* CUALIDADES */}
        {gift.qualities && gift.qualities.length > 0 && (
          <div className="px-6 mb-20">
            <motion.h3 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={sectionVariants}
              className={`font-serif text-3xl font-bold mb-8 text-center ${style.primary}`}
            >
              Lo que amo de ti
            </motion.h3>
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-wrap justify-center gap-3"
            >
              {gift.qualities.map((q, i) => (
                <motion.span
                  key={i}
                  variants={staggerItem}
                  className={`px-5 py-2.5 rounded-full text-white font-medium shadow-lg ${style.bgPrimary} text-sm tracking-wide`}
                >
                  {q}
                </motion.span>
              ))}
            </motion.div>
          </div>
        )}

        {/* NUESTRA LISTA (BUCKET LIST) */}
        {bucketList && bucketList.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={sectionVariants}
            className="px-6 mb-20"
          >
            <h3 className={`font-serif text-3xl font-bold mb-8 text-center ${style.primary}`}>Nuestra Lista</h3>
            <div className="space-y-4">
              {bucketList.map((item, i) => (
                <div key={i} className={`flex items-start p-5 rounded-2xl ${style.card} shadow-md border border-white/60`}>
                  <CheckCircle2 className={`w-6 h-6 ${style.primary} mr-4 flex-shrink-0 mt-0.5`} />
                  <span className="text-gray-800 font-medium leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* MAPA PINES (Opcional extra) */}
        {gift.mapPins && gift.mapPins.length > 0 && (
          <motion.div
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true, margin: "-50px" }}
             variants={sectionVariants}
             className="px-6 mb-20"
           >
             <h3 className={`font-serif text-3xl font-bold mb-8 text-center ${style.primary}`}>Nuestros Lugares</h3>
             <div className="grid grid-cols-2 gap-4">
               {gift.mapPins.map((place, i) => (
                 <div key={i} className={`p-5 rounded-[2rem] ${style.card} shadow-md text-center flex flex-col items-center border border-white/60`}>
                   <div className={`w-12 h-12 rounded-full ${style.bgPrimary} text-white flex items-center justify-center mb-4 shadow-inner`}>
                     <MapPin className="w-6 h-6" />
                   </div>
                   <span className="text-gray-800 font-medium text-sm leading-tight">{place}</span>
                 </div>
               ))}
             </div>
           </motion.div>
        )}

        {/* VALES DE AMOR (COUPONS) */}
        {coupons && coupons.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={sectionVariants}
            className="px-6 mb-20"
          >
            <h3 className={`font-serif text-3xl font-bold mb-8 text-center ${style.primary}`}>Vales Canjeables</h3>
            <div className="space-y-5">
              {coupons.map((voucher, i) => {
                const isUsed = usedCoupons.includes(i);
                return (
                  <motion.div 
                    key={i} 
                    whileHover={!isUsed ? { scale: 1.02 } : {}}
                    whileTap={!isUsed ? { scale: 0.98 } : {}}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-500 overflow-hidden cursor-pointer
                      ${isUsed ? 'bg-gray-100/50 border-gray-300 opacity-60 backdrop-blur-none' : `${style.card} border-dashed border-${style.accent}-300 shadow-lg`}
                    `}
                    onClick={() => {
                      if (!isUsed) {
                        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 }, colors: ['#f43f5e', '#fbbf24'] });
                        setUsedCoupons([...usedCoupons, i]);
                      }
                    }}
                  >
                    {isUsed && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] z-10">
                        <span className="text-gray-800 font-black text-2xl uppercase tracking-widest rotate-[-10deg] border-4 border-gray-800 px-6 py-2 rounded-xl">USADO</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center">
                      <Ticket className={`w-10 h-10 ${isUsed ? 'text-gray-400' : style.primary} mb-3`} />
                      <h4 className="font-bold text-gray-800 text-lg">Vale por:</h4>
                      <p className="text-gray-600 font-medium mt-2">{voucher}</p>
                      {!isUsed && <span className={`text-xs uppercase tracking-widest font-bold mt-4 ${style.primary}`}>Toca para canjear</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* RULETA INTERACTIVA */}
        {roulette && roulette.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={sectionVariants}
            className="px-6 mb-24"
          >
            <h3 className={`font-serif text-3xl font-bold mb-8 text-center ${style.primary}`}>Ruleta del Destino</h3>
            <div className={`p-8 rounded-[3rem] ${style.card} shadow-2xl border border-white text-center flex flex-col items-center relative overflow-hidden`}>
              
              {/* Círculo de la ruleta animado */}
              <motion.div 
                animate={{ rotate: rotation }}
                transition={{ duration: 3, ease: "circOut" }}
                className={`w-40 h-40 rounded-full border-[12px] border-white shadow-inner flex flex-col items-center justify-center mb-8 relative overflow-hidden ${style.bgPrimary}`}
              >
                {/* Diseño interno de la ruleta */}
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-[1px] bg-white absolute top-1/2"></div>
                  <div className="w-[1px] h-full bg-white absolute left-1/2"></div>
                  <div className="w-full h-[1px] bg-white absolute top-1/2 rotate-45"></div>
                  <div className="w-[1px] h-full bg-white absolute left-1/2 rotate-45"></div>
                </div>
                <Sparkles className="w-12 h-12 text-white relative z-10" />
              </motion.div>
              
              {/* Resultado */}
              <div className="min-h-[80px] flex items-center justify-center w-full px-2 mb-6">
                <AnimatePresence mode="wait">
                  {rouletteResult ? (
                    <motion.div
                      key={rouletteResult}
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100"
                    >
                      <p className={`font-bold text-lg ${style.primary}`}>
                        {rouletteResult}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p 
                      key="placeholder"
                      exit={{ opacity: 0 }}
                      className="font-medium text-gray-500 text-lg"
                    >
                      {rouletteSpinning ? 'Girando...' : '¿Qué haremos hoy?'}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={spinRoulette}
                disabled={rouletteSpinning}
                className={`px-10 py-3.5 rounded-full text-white font-bold tracking-widest shadow-xl transition-all ${rouletteSpinning ? 'bg-gray-400 scale-95' : `${style.bgPrimary} hover:scale-105 active:scale-95`}`}
              >
                GIRAR RULETA
              </button>
            </div>
          </motion.div>
        )}

        {/* PREGUNTA FINAL */}
        {finalQuestion && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={sectionVariants}
            className="px-6 pb-40"
          >
            <div className="p-10 bg-white rounded-[3rem] shadow-2xl text-center relative overflow-hidden border-4 border-white/50">
              <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-5 blur-3xl ${style.bgPrimary}`}></div>
              <div className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-5 blur-3xl ${style.bgPrimary}`}></div>
              
              <h3 className="font-serif text-3xl font-extrabold mb-12 text-gray-800 relative z-10 leading-tight">
                ¿Quieres continuar esta historia conmigo?
              </h3>
              
              <div className="flex flex-col items-center gap-5 relative z-10 min-h-[140px]">
                <button 
                  onClick={() => {
                    confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
                    alert('¡Sabía que dirías que sí! ❤️');
                  }}
                  className={`px-12 py-4 ${style.bgPrimary} text-white rounded-full font-black text-xl shadow-xl shadow-${style.accent}-500/30 transition-transform hover:scale-110 active:scale-95 w-[200px] z-20`}
                >
                  ¡SÍ!
                </button>
                
                <motion.button
                  animate={noButtonPos}
                  onHoverStart={handleNoHover}
                  onClick={handleNoHover}
                  className="px-12 py-4 bg-gray-100 text-gray-400 rounded-full font-bold text-xl shadow-inner w-[200px] absolute top-20"
                >
                  No
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Footer */}
        <div className="pb-12 text-center">
          <Smile className={`w-6 h-6 mx-auto mb-3 opacity-30 ${style.primary}`} />
          <p className="text-xs font-bold text-gray-400/60 tracking-widest uppercase">
            Hecho con mucho amor
          </p>
        </div>

      </div>
    </div>
  );
}
