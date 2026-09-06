import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import { TemplateConfig } from '../pages/Dashboard';

export interface VideoEditorPreviewProps {
  config: TemplateConfig;
  onUpdateConfig: (newConfig: any) => void;
  backgroundUrl: string;
  customBackground: string;
  userPhotoUrl: string;
  titulo: string;
  artista: string;
  dedicatoria: string;
  scale: number;
}

export const VideoEditorPreview: React.FC<VideoEditorPreviewProps> = ({
  config,
  onUpdateConfig,
  backgroundUrl,
  customBackground,
  userPhotoUrl,
  titulo,
  artista,
  dedicatoria,
  scale
}) => {
  const [constraintsRef, setConstraintsRef] = useState<HTMLDivElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const setConfig = (updater: any) => {
    if (typeof updater === 'function') {
      onUpdateConfig(updater(config));
    } else {
      onUpdateConfig(updater);
    }
  };

  const renderTextNode = (key: 'titulo' | 'artista' | 'dedicatoria', text: string, placeholder: string) => {
    const t = config[key];
    const isSelected = selectedElement === key;
    const isCenter = t.align === 'center';

    return (
      <motion.div
        drag={isCenter ? "y" : true}
        dragMomentum={false}
        dragConstraints={constraintsRef || false}
        onDragStart={() => setSelectedElement(key)}
        onDragEnd={(e, info) => {
          const newX = isCenter ? t.x : Number(t.x) + (info.offset.x / scale);
          const newY = t.y + (info.offset.y / scale);
          setConfig((prev: any) => ({
            ...prev,
            [key]: { ...t, x: Math.round(newX), y: Math.round(newY) }
          }));
        }}
        animate={{ x: isCenter ? 0 : t.x, y: t.y }}
        onClick={(e: any) => { e.stopPropagation(); setSelectedElement(key); }}
        className={`absolute whitespace-nowrap cursor-move touch-none ${isSelected ? 'ring-4 ring-indigo-500/50 rounded-lg' : ''}`}
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
              <input type="number" value={t.fontSize} onChange={e => setConfig((prev: any) => ({ ...prev, [key]: { ...t, fontSize: Number(e.target.value) } }))} className="w-32 text-[32px] bg-gray-800 text-white rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[24px] text-gray-400 font-medium">Color</label>
              <input type="color" value={t.color} onChange={e => setConfig((prev: any) => ({ ...prev, [key]: { ...t, color: e.target.value } }))} className="w-24 h-[52px] rounded-lg cursor-pointer bg-transparent" />
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
        ref={setConstraintsRef}
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

        {constraintsRef && (
          <>
            <motion.div
              drag
              dragMomentum={false}
              dragConstraints={constraintsRef}
              onDragStart={() => setSelectedElement('photo')}
              onDragEnd={(e, info) => {
                setConfig((prev: any) => ({ ...prev, photo: { ...prev.photo, x: Math.round(prev.photo.x + info.offset.x / scale), y: Math.round(prev.photo.y + info.offset.y / scale) } }));
              }}
              animate={{ x: config.photo.x, y: config.photo.y }}
              onClick={(e: any) => { e.stopPropagation(); setSelectedElement('photo'); }}
              className={`absolute group touch-none ${selectedElement === 'photo' ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-transparent' : ''}`}
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
                    setConfig((prev: any) => ({ ...prev, photo: { ...prev.photo, w: Math.round(newW), h: Math.round(newH) } }));
                  }}
                  className="absolute -bottom-8 -right-8 w-16 h-16 bg-indigo-600 rounded-full cursor-nwse-resize shadow-[0_0_30px_rgba(0,0,0,0.5)] border-[6px] border-white z-50 flex items-center justify-center hover:scale-110 transition-transform touch-none"
                >
                  <div className="w-6 h-6 border-b-4 border-r-4 border-white translate-x-[-4px] translate-y-[-4px]" />
                </motion.div>
              )}
            </motion.div>

            {renderTextNode('titulo', titulo, 'Título de Canción')}
            {renderTextNode('artista', artista, 'Nombre del Artista')}
            {renderTextNode('dedicatoria', dedicatoria, 'Mensaje de dedicatoria...')}
          </>
        )}
      </div>
    </div>
  );
};