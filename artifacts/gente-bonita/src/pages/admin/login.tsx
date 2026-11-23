import { useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Senha autorizada pelo proprietário
    const isMasterPassword = password === 'On2026Duo';

    // Tentativa com Supabase Auth
    try {
      await supabase.auth.signInWithPassword({
        email: 'admin@duoespaco.com',
        password,
      });
    } catch (err) {
      console.warn('Supabase auth attempt', err);
    }

    setLoading(false);

    if (isMasterPassword) {
      sessionStorage.setItem('duo_admin_session', 'true');
      toast({
        title: 'Bem-vindo ao Painel DUO ESPAÇO',
        description: 'Autenticação realizada com sucesso.',
      });
      setLocation('/admin');
    } else {
      toast({
        title: 'Acesso negado',
        description: 'Senha incorreta. Verifique e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0908] p-4 text-[#F5F0E8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(187,141,91,0.12),transparent_60%)] pointer-events-none" />

      <Card className="relative w-full max-w-sm bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(187,141,91,0.15)]">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#BB8D5B]/40 bg-[#BB8D5B]/10 text-[#E0BC8D] mb-3">
            <Lock size={24} />
          </div>
          <CardTitle className="font-serif text-2xl font-bold tracking-wide text-[#E0BC8D]">
            DUO ESPAÇO
          </CardTitle>
          <CardDescription className="font-mono text-xs uppercase tracking-widest text-[#BB8D5B]">
            Área Administrativa
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-[#A99B90]">
                Senha de Acesso
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha..."
                required
                className="bg-[#0B0908] border-[#BB8D5B]/30 text-[#F5F0E8] focus:border-[#BB8D5B] focus:ring-1 focus:ring-[#BB8D5B]"
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#BB8D5B] text-[#0B0908] hover:bg-[#E0BC8D] font-mono font-bold uppercase tracking-wider text-xs py-5 mt-4 transition-all shadow-[0_4px_16px_rgba(187,141,91,0.25)]"
              disabled={loading}
            >
              {loading ? 'Validando...' : 'Acessar Painel'}
            </Button>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setLocation('/')}
                className="inline-flex items-center gap-1.5 text-xs text-[#A99B90] hover:text-[#E0BC8D] transition-colors"
              >
                <ArrowLeft size={14} /> Voltar ao Site
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
