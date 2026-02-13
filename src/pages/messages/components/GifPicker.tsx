import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import axios from 'axios';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Using a common public test key for Tenor
  const TENOR_API_KEY = 'LIVDSRZULELA';

  const fetchGifs = async (query = '') => {
    setLoading(true);
    try {
      const endpoint = query 
        ? `https://g.tenor.com/v1/search?q=${query}&key=${TENOR_API_KEY}&limit=12`
        : `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=12`;
      
      const response = await axios.get(endpoint);
      setGifs(response.data.results || []);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGifs(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="absolute bottom-full mb-2 left-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="relative flex-1 mr-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search Tenor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-100 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary"
          />
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xs">ESC</button>
      </div>

      <div className="h-64 overflow-y-auto p-2">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.media[0].tinygif.url)}
                className="relative aspect-video rounded-lg overflow-hidden hover:scale-105 transition-transform"
              >
                <img src={gif.media[0].tinygif.url} alt={gif.content_description} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
