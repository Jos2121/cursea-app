import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, Volume2, VolumeX, MapPin, CheckCircle2, Ticket, Gift as GiftIcon } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

export default function PublicGift() {
  const { slug } = useParams<{ slug: string }>();
  const [gift, setGift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // States for interactive sections
  const [usedVouchers, setUsedVouchers] = useState<Record<number, boolean>>({});
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Embla carousel
  const [emblaRef] = useEmblaCarousel({ loop: true });

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
    // Confetti explosion
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#f9a8d4']
    });

    setIsOpen(true);
    
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

  const spinRoulette = () => {
    if (!gift.rouletteQuestions || gift.rouletteQuestions.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setRouletteResult(null);
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * gift.rouletteQuestions.length);
      setRouletteResult(gift.rouletteQuestions[randomIndex]);
      setIsSpinning(false);
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.7 }
      });
    }, 2000);
  };

  const redeemVoucher = (index: number) => {
    setUsedVouchers(prev => ({ ...prev, [index]: true }));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-rose-50 text-rose-500 font-serif text-xl">Cargando sorpresa...</div>;
  }

  if (error || !gift) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800 font-serif text-xl">404 - No se encontró el regalo.</div>;
  }

  const currentTheme = gift.theme || 'rose';
  
  const themeStyles = {
    rose: {
      bg: 'bg-gradient-to-br from-rose-50 to-pink-100',
      textAccent: 'text-rose-600',
      bgAccent: 'bg-rose-500',
      card: 'bg-white/80',
      envelope: 'bg-rose-300'
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 to-blue-100',
      textAccent: 'text-indigo-600',
      bgAccent: 'bg-indigo-500',
      card: 'bg-white/80',
      envelope: 'bg-indigo-300'
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-50 to-orange-100',
      textAccent: 'text-amber-600',
      bgAccent: 'bg-amber-500',
      card: 'bg-white/80',
      envelope: 'bg-amber-300'
    }
  };

  const activeTheme = themeStyles[currentTheme as keyof typeof themeStyles] || themeStyles.rose;

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${activeTheme.bg} font-sans text-gray-800`}>
      
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={gift.youtubeLink && gift.youtubeLink.includes('youtube.com') ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' : gift.youtubeLink} 
        loop
      />

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="envelope"
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${activeTheme.bg}`}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="cursor-pointer flex flex-col items-center"
              onClick={handleOpen}
            >
              <div className="relative w-64 h-48 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white bg-white/50 backdrop-blur-md">
                <Heart className={`w-20 h-20 ${activeTheme.textAccent} fill-current drop-shadow-lg`} />
              </div>
              <p className={`mt-8 font-serif text-2xl italic font-bold ${activeTheme.textAccent}`}>
                Toca para abrir
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`transition-opacity duration-1000 w-full max-w-md mx-auto ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Floating Audio Controls */}
        <button 
          onClick={toggleAudio}
          className="fixed top-6 right-6 z-40 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-800 hover:bg-white transition"
        >
          {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <div className="px-6 py-20 flex flex-col items-center text-center">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col items-center mb-16"
          >
            {gift.photos && gift.photos[0] && (
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6">
                <img src={gift.photos[0]} alt="Nosotros" className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className={`font-serif text-5xl mb-2 font-bold ${activeTheme.textAccent} drop-shadow-sm`}>
              {gift.names}
            </h1>
            {gift.startDate && (
              <p className="text-sm font-medium tracking-widest uppercase opacity-70 mt-2">
                Juntos desde {new Date(gift.startDate).toLocaleDateString()}
              </p>
            )}
          </motion.div>

          {/* Main Message */}
          {gift.mainMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`w-full ${activeTheme.card} backdrop-blur-sm p-8 rounded-3xl shadow-xl mb-16 relative`}
            >
              <Heart className={`absolute -top-4 -right-4 w-12 h-12 ${activeTheme.textAccent} opacity-20 transform rotate-12`} />
              <p className="text-lg leading-relaxed whitespace-pre-wrap font-serif italic text-gray-700">
                "{gift.mainMessage}"
              </p>
            </motion.div>
          )}

          {/* Carousel */}
          {gift.photos && gift.photos.length > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="w-full mb-16"
            >
              <h3 className={`font-serif text-3xl font-bold mb-6 ${activeTheme.textAccent}`}>Recuerdos</h3>
              <div className="overflow-hidden rounded-2xl shadow-xl border-4 border-white" ref={emblaRef}>
                <div className="flex">
                  {gift.photos.map((url: string, idx: number) => (
                    <div className="flex-[0_0_100%] min-w-0 relative h-96" key={idx}>
                      <img src={url} alt={`Recuerdo ${idx + 1}`} className="absolute block w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Qualities */}
          {gift.qualities && gift.qualities.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="w-full mb-16 text-left"
            >
              <h3 className={`font-serif text-3xl font-bold mb-6 text-center ${activeTheme.textAccent}`}>Lo que amo de ti</h3>
              <div className="flex flex-col gap-3">
                {gift.qualities.map((q: string, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className={`px-6 py-4 rounded-2xl shadow-sm ${activeTheme.card} flex items-center font-medium`}
                  >
                    <Heart className={`w-5 h-5 mr-3 ${activeTheme.textAccent} fill-current`} />
                    {q}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Bucket List (Things to Do) */}
          {gift.thingsToDo && gift.thingsToDo.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="w-full mb-16 text-left"
            >
              <h3 className={`font-serif text-3xl font-bold mb-6 text-center ${activeTheme.textAccent}`}>Nuestra Lista</h3>
              <div className="space-y-3">
                {gift.thingsToDo.map((item: string, i: number) => (
                  <div key={i} className={`p-4 rounded-xl shadow-sm ${activeTheme.card} flex items-start`}>
                    <CheckCircle2 className={`w-6 h-6 mr-3 flex-shrink-0 ${activeTheme.textAccent}`} />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Map Pins */}
          {gift.mapPins && gift.mapPins.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="w-full mb-16 text-left"
            >
              <h3 className={`font-serif text-3xl font-bold mb-6 text-center ${activeTheme.textAccent}`}>Lugares Especiales</h3>
              <div className="grid gap-4">
                {gift.mapPins.map((place: string, i: number) => (
                  <div key={i} className={`p-5 rounded-2xl shadow-sm ${activeTheme.card} flex items-center`}>
                    <div className={`p-3 rounded-full mr-4 bg-white shadow-inner`}>
                      <MapPin className={`w-6 h-6 ${activeTheme.textAccent}`} />
                    </div>
                    <span className="font-bold text-lg">{place}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Love Vouchers */}
          {gift.loveVouchers && gift.loveVouchers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="w-full mb-16 text-left"
            >
              <h3 className={`font-serif text-3xl font-bold mb-6 text-center ${activeTheme.textAccent}`}>Vales de Amor</h3>
              <div className="space-y-4">
                {gift.loveVouchers.map((voucher: string, i: number) => (
                  <div key={i} className={`relative overflow-hidden p-6 rounded-2xl shadow-md border-2 border-dashed ${usedVouchers[i] ? 'bg-gray-100 border-gray-300' : `${activeTheme.card} border-${activeTheme.textAccent.split('-')[1]}-300`}`}>
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center">
                        <Ticket className={`w-6 h-6 mr-3 ${usedVouchers[i] ? 'text-gray-400' : activeTheme.textAccent}`} />
                        <span className={`font-bold ${usedVouchers[i] ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{voucher}</span>
                      </div>
                      <button 
                        onClick={() => redeemVoucher(i)}
                        disabled={usedVouchers[i]}
                        className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${usedVouchers[i] ? 'bg-gray-200 text-gray-500' : `${activeTheme.bgAccent} text-white shadow-md`}`}
                      >
                        {usedVouchers[i] ? 'Usado' : 'Canjear'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Interactive Roulette */}
          {gift.rouletteQuestions && gift.rouletteQuestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`w-full p-8 rounded-[2rem] shadow-xl text-center mb-16 ${activeTheme.card} border-4 border-white`}
            >
              <GiftIcon className={`w-12 h-12 mx-auto mb-4 ${activeTheme.textAccent}`} />
              <h3 className={`font-serif text-3xl font-bold mb-2 ${activeTheme.textAccent}`}>Ruleta Sorpresa</h3>
              <p className="text-sm text-gray-500 mb-8">Presiona para girar la ruleta y descubrir tu premio o pregunta.</p>
              
              <div className="relative w-48 h-48 mx-auto mb-8 cursor-pointer" onClick={spinRoulette}>
                <motion.div 
                  animate={{ rotate: isSpinning ? 360 * 5 : 0 }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className={`w-full h-full rounded-full border-8 border-white shadow-inner flex items-center justify-center bg-gradient-to-tr from-gray-100 to-gray-50 relative`}
                >
                  {/* Fake roulette slices */}
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-gray-300 opacity-20"></div>
                  <div className={`w-16 h-16 rounded-full ${activeTheme.bgAccent} shadow-lg flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">GIRAR</span>
                  </div>
                </motion.div>
                {/* Pointer */}
                <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] ${activeTheme.textAccent.replace('text-', 'border-t-')} z-10`}></div>
              </div>

              <AnimatePresence mode="wait">
                {rouletteResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                  >
                    <p className="font-bold text-lg text-gray-800">{rouletteResult}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Final Question */}
          {gift.finalQuestionEnabled && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mt-8 p-10 bg-white rounded-[3rem] shadow-2xl border-4 border-white w-full relative overflow-hidden"
            >
              <Heart className={`absolute -top-10 -right-10 w-48 h-48 opacity-5 ${activeTheme.textAccent}`} />
              <h3 className="font-serif text-3xl font-extrabold mb-8 relative z-10 text-gray-800">
                ¿Aceptas una nueva aventura conmigo?
              </h3>
              <div className="flex flex-col gap-4 relative z-10">
                <button 
                  onClick={() => {
                    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
                    alert('¡Sabía que dirías que sí! ❤️');
                  }}
                  className={`py-4 px-8 rounded-full font-bold text-xl shadow-lg transition-transform transform hover:scale-105 text-white ${activeTheme.bgAccent}`}
                >
                  ¡SÍ, ACEPTO!
                </button>
                <motion.button 
                  whileHover={{ scale: 0.95, x: [0, -20, 20, -20, 0] }}
                  transition={{ duration: 0.4 }}
                  className="py-4 px-8 bg-gray-100 text-gray-400 rounded-full font-bold text-lg shadow-sm"
                >
                  No
                </motion.button>
              </div>
            </motion.div>
          )}
          
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  );
}
