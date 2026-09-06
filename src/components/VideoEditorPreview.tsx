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
  scale
}) => {

  const renderTextNode = (key: 'titulo' | 'artista' | 'dedicatoria', text: string, placeholder: string) => {
    const t = config[key];
    const isCenter = t.align === 'center';

    if (key === 'dedicatoria') {
      return (
        <div
          className="absolute text-center break-words max-w-[75%] leading-relaxed drop-shadow-md"
          style={{
            left: '50%',
            top: `${(t.y / 1920) * 100}%`,
            transform: 'translateX(-50%)',
            width: 'max-content',
            fontSize: `${(26 * scale)}px`, // Match backend fixed 26px
            color: t.color,
          }}
        >
          {text || placeholder}
        </div>
      );
    }

    // Calculamos la posición porcentual asumiendo un lienzo base de 1080x1920.
    const leftPos = isCenter ? '10%' : `${(Number(t.x) / 1080) * 100}%`;
    const widthVal = isCenter ? '80%' : `calc(90% - ${(Number(t.x) / 1080) * 100}%)`;

    return (
      <div
        className="absolute whitespace-pre-wrap break-words drop-shadow-md"
        style={{
          left: leftPos,
          top: `${(t.y / 1920) * 100}%`,
          width: widthVal,
          fontSize: `${t.fontSize * scale}px`,
          color: t.color,
          textAlign: t.align as any,
          lineHeight: '1.25'
        }}
      >
        {text || placeholder}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl shrink-0 aspect-[9/16]">
      {/* Background */}
      {backgroundUrl !== 'custom' ? (
        <img src={`/media/${backgroundUrl}`} className="absolute inset-0 w-full h-full object-cover object-center" />
      ) : customBackground ? (
        <img src={customBackground} className="absolute inset-0 w-full h-full object-cover object-center" />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gray-900" />
      )}

      {/* Cover Photo */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${(config.photo.x / 1080) * 100}%`,
          top: `${(config.photo.y / 1920) * 100}%`,
          width: `${(config.photo.w / 1080) * 100}%`,
          height: `${(config.photo.h / 1920) * 100}%`,
        }}
      >
        {userPhotoUrl ? (
          <img src={userPhotoUrl} className="w-full h-full object-cover rounded-md shadow-2xl" />
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
