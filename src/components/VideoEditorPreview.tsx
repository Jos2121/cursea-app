import React from 'react';
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
  
  // Explicit coordinate overrides
  photoX?: number;
  photoY?: number;
  photoWidth?: number;
  photoHeight?: number;
  tituloX?: number | string;
  tituloY?: number;
  tituloSize?: number;
  artistaX?: number | string;
  artistaY?: number;
  artistaSize?: number;
  dedicatoriaX?: number | string;
  dedicatoriaY?: number;
  dedicatoriaSize?: number;

  scale: number;
}

export const VideoEditorPreview: React.FC<VideoEditorPreviewProps> = ({
  config,
  backgroundUrl,
  customBackground,
  userPhotoUrl,
  titulo,
  artista,
  dedicatoria,
  
  photoX,
  photoY,
  photoWidth,
  photoHeight,
  tituloX,
  tituloY,
  tituloSize,
  artistaX,
  artistaY,
  artistaSize,
  dedicatoriaX,
  dedicatoriaY,
  dedicatoriaSize,
  
  scale
}) => {

  const renderTextNode = (key: 'titulo' | 'artista' | 'dedicatoria', text: string, placeholder: string) => {
    const t = config[key];
    
    // Resolve dynamic positions/sizes
    let activeX: number | string = t.x;
    let activeY: number = t.y;
    let activeSize: number = t.fontSize;

    if (key === 'titulo') {
      if (tituloX !== undefined) activeX = tituloX;
      if (tituloY !== undefined) activeY = tituloY;
      if (tituloSize !== undefined) activeSize = tituloSize;
    } else if (key === 'artista') {
      if (artistaX !== undefined) activeX = artistaX;
      if (artistaY !== undefined) activeY = artistaY;
      if (artistaSize !== undefined) activeSize = artistaSize;
    } else if (key === 'dedicatoria') {
      if (dedicatoriaX !== undefined) activeX = dedicatoriaX;
      if (dedicatoriaY !== undefined) activeY = dedicatoriaY;
      if (dedicatoriaSize !== undefined) activeSize = dedicatoriaSize;
    }

    const isCenter = t.align === 'center';

    if (key === 'dedicatoria') {
      return (
        <div
          className="absolute text-center break-words max-w-[75%] leading-relaxed drop-shadow-md"
          style={{
            left: activeX === 'center' ? '50%' : `${(Number(activeX) / 1080) * 100}%`,
            top: `${(activeY / 1920) * 100}%`,
            transform: activeX === 'center' ? 'translateX(-50%)' : 'none',
            width: 'max-content',
            fontSize: `${(activeSize * scale)}px`, 
            color: t.color,
          }}
        >
          {text || placeholder}
        </div>
      );
    }

    const leftPos = isCenter ? '10%' : `${(Number(activeX) / 1080) * 100}%`;
    const widthVal = isCenter ? '80%' : `calc(90% - ${(Number(activeX) / 1080) * 100}%)`;

    return (
      <div
        className="absolute whitespace-pre-wrap break-words drop-shadow-md"
        style={{
          left: leftPos,
          top: `${(activeY / 1920) * 100}%`,
          width: widthVal,
          fontSize: `${activeSize * scale}px`,
          color: t.color,
          textAlign: t.align as any,
          lineHeight: '1.25'
        }}
      >
        {text || placeholder}
      </div>
    );
  };

  const finalPhotoX = photoX !== undefined ? photoX : config.photo.x;
  const finalPhotoY = photoY !== undefined ? photoY : config.photo.y;
  const finalPhotoW = photoWidth !== undefined ? photoWidth : config.photo.w;
  const finalPhotoH = photoHeight !== undefined ? photoHeight : config.photo.h;

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl shrink-0 aspect-[9/16]">
      {/* Background */}
      {backgroundUrl === 'custom' && customBackground ? (
        <img src={customBackground.trim()} className="absolute inset-0 w-full h-full object-cover object-center" />
      ) : backgroundUrl ? (
        <img src={backgroundUrl.startsWith('http') || backgroundUrl.startsWith('blob:') || backgroundUrl.startsWith('data:') ? backgroundUrl.trim() : `/media/${backgroundUrl.trim()}`} className="absolute inset-0 w-full h-full object-cover object-center" />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gray-900" />
      )}

      {/* Cover Photo */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${(finalPhotoX / 1080) * 100}%`,
          top: `${(finalPhotoY / 1920) * 100}%`,
          width: `${(finalPhotoW / 1080) * 100}%`,
          height: `${(finalPhotoH / 1920) * 100}%`,
        }}
      >
        {userPhotoUrl ? (
          <img src={userPhotoUrl.trim()} className="w-full h-full object-cover rounded-md shadow-2xl" />
        ) : (
          <div className="w-full h-full bg-gray-800/80 backdrop-blur flex flex-col items-center justify-center text-gray-400 rounded-md border-2 border-dashed border-gray-600">
            <ImageIcon className="w-8 h-8 md:w-12 md:h-12 mb-2" />
            <span className="text-[10px] md:text-xs font-medium text-center">Cover Photo</span>
          </div>
        )}
      </div>

      {/* Texts */}
      {renderTextNode('titulo', titulo, 'Título de Canción')}
      {renderTextNode('artista', artista, 'Nombre del Artista')}
      {renderTextNode('dedicatoria', dedicatoria, 'Mensaje de dedicatoria...')}
    </div>
  );
};