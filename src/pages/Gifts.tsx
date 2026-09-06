import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Calendar, Heart } from 'lucide-react';

export default function Gifts() {
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    try {
      const res = await fetch('/api/gifts');
      const data = await res.json();
      setGifts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0B0F19] text-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Heart className="w-8 h-8 text-rose-500 mr-3 fill-rose-500" />
              Regalos Personalizados
            </h1>
            <p className="text-gray-400">Administra y crea sitios web sorpresa para parejas.</p>
          </div>
          <Link
            to="/gifts/new"
            className="flex items-center px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-rose-900/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Nuevo Sitio
          </Link>
        </div>

        <div className="bg-[#111827] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#171F2E] text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Nombres de la Pareja</th>
                  <th className="px-6 py-4 font-medium">Fecha Especial</th>
                  <th className="px-6 py-4 font-medium">Enlace Público</th>
                  <th className="px-6 py-4 font-medium">Creado el</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Cargando sitios...
                    </td>
                  </tr>
                )}
                {!loading && gifts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Aún no has creado ningún sitio de regalo.
                    </td>
                  </tr>
                )}
                {gifts.map((gift) => (
                  <tr key={gift.id} className="hover:bg-[#1A2333] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      {gift.names}
                    </td>
                    <td className="px-6 py-4 text-gray-400 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {gift.startDate ? new Date(gift.startDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={`/p/${gift.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-rose-400 rounded-lg transition-colors text-xs font-medium"
                      >
                        Ver Sitio
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(gift.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
