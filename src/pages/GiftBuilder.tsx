import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Heart, Music, MessageCircle, Star, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

type FormValues = {
  names: string;
  startDate: string;
  photosText: string;
  youtubeLink: string;
  mainMessage: string;
  qualitiesText: string;
  theme: string;
  finalQuestionEnabled: boolean;
};

export default function GiftBuilder() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      names: 'Ana y Juan',
      startDate: '2023-02-14',
      photosText: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500\nhttps://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=500',
      youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      mainMessage: 'Feliz Aniversario mi amor. Gracias por todos los momentos hermosos que hemos compartido...',
      qualitiesText: 'Tu sonrisa, Tu forma de apoyarme, Lo inteligente que eres',
      theme: 'rose',
      finalQuestionEnabled: true
    }
  });

  const watchAllFields = watch();

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      // Process raw text into arrays
      const payload = {
        names: data.names,
        startDate: data.startDate,
        photos: data.photosText.split('\n').map(p => p.trim()).filter(Boolean),
        youtubeLink: data.youtubeLink,
        mainMessage: data.mainMessage,
        qualities: data.qualitiesText.split(',').map(q => q.trim()).filter(Boolean),
        theme: data.theme,
        finalQuestionEnabled: data.finalQuestionEnabled
      };

      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseData = await res.json();
      if (res.ok) {
        alert('¡Sitio creado con éxito!');
        navigate('/gifts');
      } else {
        alert('Error: ' + responseData.statusMessage);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex bg-[#0B0F19] overflow-hidden">
      
      {/* LEFT COLUMN: Builder Form */}
      <div className="w-1/2 flex flex-col border-r border-gray-800 bg-[#111827]">
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center text-white">
            <Link to="/gifts" className="mr-4 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-lg font-bold">Crear Nuevo Sitio</h2>
          </div>
          <button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Publicar Sitio'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form className="space-y-8 max-w-xl mx-auto">
            
            {/* Sec 1 */}
            <div className="bg-[#171F2E] p-6 rounded-2xl border border-gray-800">
              <h3 className="text-white font-semibold flex items-center mb-4">
                <Heart className="w-4 h-4 mr-2 text-rose-400" />
                1. Datos Principales
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nombres de la pareja</label>
                  <input {...register("names")} className="w-full px-4 py-2 bg-[#1F2937] border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fecha de Inicio / Aniversario</label>
                  <input type="date" {...register("startDate")} className="w-full px-4 py-2 bg-[#1F2937] border border-gray-700 rounded-lg text-white" />
                </div>
              </div>
            </div>

            {/* Sec 2 */}
            <div className="bg-[#171F2E] p-6 rounded-2xl border border-gray-800">
              <h3 className="text-white font-semibold flex items-center mb-4">
                <Star className="w-4 h-4 mr-2 text-rose-400" />
                2. Contenido Multimedia
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fotos (URLs separadas por salto de línea)</label>
                  <textarea rows={4} {...register("photosText")} className="w-full px-4 py-2 bg-[#1F2937] border border-gray-700 rounded-lg text-white text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1 flex items-center">
                    <Music className="w-3 h-3 mr-1" /> Link de YouTube (Música de fondo)
                  </label>
                  <input {...register("youtubeLink")} className="w-full px-4 py-2 bg-[#1F2937] border border-gray-700 rounded-lg text-white text-sm" />
                </div>
              </div>
            </div>

            {/* Sec 3 */}
            <div className="bg-[#171F2E] p-6 rounded-2xl border border-gray-800">
              <h3 className="text-white font-semibold flex items-center mb-4">
                <MessageCircle className="w-4 h-4 mr-2 text-rose-400" />
                3. Mensaje y Detalles
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Carta / Mensaje Principal</label>
                  <textarea rows={5} {...register("mainMessage")} className="w-full px-4 py-2 bg-[#1F2937] border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cualidades que amas (Separadas por comas)</label>
                  <input {...register("qualitiesText")} className="w-full px-4 py-2 bg-[#1F2937] border border-gray-700 rounded-lg text-white" />
                </div>
              </div>
            </div>

            {/* Sec 4 */}
            <div className="bg-[#171F2E] p-6 rounded-2xl border border-gray-800">
              <h3 className="text-white font-semibold flex items-center mb-4">
                <Settings className="w-4 h-4 mr-2 text-rose-400" />
                4. Configuración
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Color de Tema</label>
                  <select {...register("theme")} className="w-full px-4 py-2 bg-[#1F2937] border border-gray-700 rounded-lg text-white">
                    <option value="rose">Rosa / Romántico</option>
                    <option value="indigo">Indigo / Elegante</option>
                    <option value="amber">Ambar / Cálido</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <input type="checkbox" id="fq" {...register("finalQuestionEnabled")} className="w-5 h-5 rounded border-gray-700 text-rose-600 focus:ring-rose-500 bg-[#1F2937]" />
                  <label htmlFor="fq" className="text-sm text-gray-300">Habilitar pregunta interactiva "¿Me perdonas?" o similar al final</label>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Preview */}
      <div className="w-1/2 bg-[#0B0F19] flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background blobs for preview area */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px]"></div>
        
        {/* Mobile Device Mockup */}
        <div className="relative w-[375px] h-[812px] bg-white rounded-[40px] border-[8px] border-gray-800 shadow-2xl overflow-hidden flex flex-col">
          {/* Status bar mock */}
          <div className="h-6 w-full bg-transparent absolute top-0 z-50 flex justify-center">
            <div className="w-32 h-6 bg-gray-800 rounded-b-2xl"></div>
          </div>

          {/* Preview Content */}
          <div className={`flex-1 overflow-y-auto ${watchAllFields.theme === 'rose' ? 'bg-rose-50' : watchAllFields.theme === 'amber' ? 'bg-amber-50' : 'bg-indigo-50'}`}>
            <div className="p-6 pt-16 flex flex-col items-center text-center">
              
              {/* Photo preview */}
              {watchAllFields.photosText && watchAllFields.photosText.split('\n')[0] && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-6">
                  <img src={watchAllFields.photosText.split('\n')[0]} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <h1 className={`text-2xl font-bold mb-2 ${watchAllFields.theme === 'rose' ? 'text-rose-600' : watchAllFields.theme === 'amber' ? 'text-amber-600' : 'text-indigo-600'}`}>
                {watchAllFields.names || 'Nombres...'}
              </h1>
              
              <div className="bg-white/60 p-4 rounded-xl shadow-sm mb-6 w-full text-left backdrop-blur-sm">
                <p className="text-sm text-gray-700 italic whitespace-pre-wrap">
                  {watchAllFields.mainMessage || 'Escribe tu mensaje especial aquí...'}
                </p>
              </div>

              {watchAllFields.qualitiesText && (
                <div className="w-full text-left mb-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Lo que más amo de ti:</h3>
                  <div className="flex flex-wrap gap-2">
                    {watchAllFields.qualitiesText.split(',').map((q, i) => q.trim() && (
                      <span key={i} className={`text-xs px-3 py-1 rounded-full text-white ${watchAllFields.theme === 'rose' ? 'bg-rose-500' : watchAllFields.theme === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                        {q.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {watchAllFields.finalQuestionEnabled && (
                <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100 w-full">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">¿Pregunta final?</h3>
                  <div className="flex justify-center gap-4">
                    <button className="px-6 py-2 bg-green-500 text-white rounded-full font-bold shadow-md">Sí</button>
                    <button className="px-6 py-2 bg-red-500 text-white rounded-full font-bold shadow-md opacity-50">No</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
