import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Settings, Music, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        setError(data.statusMessage || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5EADC] font-sans selection:bg-[#8B1F32]/20 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#8B1F32]/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#8B1F32]/5 blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-md p-10 bg-white border border-[#8B1F32]/10 rounded-[40px] shadow-2xl space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-[#8B1F32]/10 border border-[#8B1F32]/20 shadow-sm mb-6">
            <Music className="w-10 h-10 text-[#8B1F32]" />
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border border-neutral-100">
              <Sparkles className="w-3.5 h-3.5 text-[#8B1F32]" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900 tracking-tight">Cursea Digital</h1>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">Admin Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-neutral-500 tracking-widest pl-1">Clave de Acceso</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-2xl border-neutral-200 focus:ring-[#8B1F32] focus:border-[#8B1F32] transition-all bg-neutral-50/50 text-center text-lg"
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">
              <p className="text-rose-600 text-[10px] font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-[#8B1F32] hover:bg-[#731929] text-white rounded-2xl shadow-xl shadow-[#8B1F32]/25 font-bold transition-all text-base transform hover:-translate-y-0.5 active:scale-95"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} • Cursea Digital
          </p>
        </div>
      </div>
    </div>
  );
}
