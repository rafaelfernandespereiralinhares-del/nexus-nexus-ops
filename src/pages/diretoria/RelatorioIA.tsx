import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Brain, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function RelatorioIA() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [gerando, setGerando] = useState(false);
  const [relatorioAtual, setRelatorioAtual] = useState('');
  const [historico, setHistorico] = useState<{ id: string; data: string; texto: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('relatorios_ia').select('*').eq('empresa_id', profile.empresa_id).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setHistorico(data as any); });
  }, [profile]);

  const gerarRelatorio = async () => {
    if (!profile?.empresa_id) return;
    setGerando(true);
    setRelatorioAtual('');

    try {
      const resp = await supabase.functions.invoke('gerar-relatorio-ia', {
        body: { empresa_id: profile.empresa_id },
      });

      if (resp.error) throw resp.error;
      const texto = resp.data?.texto || 'Relatório gerado sem conteúdo.';
      setRelatorioAtual(texto);

      // Refresh historico
      const { data } = await supabase.from('relatorios_ia').select('*').eq('empresa_id', profile.empresa_id).order('created_at', { ascending: false }).limit(10);
      if (data) setHistorico(data as any);

      toast({ title: 'Relatório gerado com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Relatório IA</h1>
        <Button onClick={gerarRelatorio} disabled={gerando} className="gap-2">
          {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {gerando ? 'Gerando...' : 'Gerar Relatório IA'}
        </Button>
      </div>

      {relatorioAtual && (
        <Card>
          <CardHeader><CardTitle>Relatório Atual</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">{relatorioAtual}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Histórico de Relatórios</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {historico.map(r => (
            <div key={r.id} className="rounded-lg border p-4">
              <p className="mb-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</p>
              <p className="whitespace-pre-wrap text-sm">{r.texto.slice(0, 500)}{r.texto.length > 500 ? '...' : ''}</p>
              {r.texto.length > 500 && (
                <Button variant="link" size="sm" className="mt-1 p-0" onClick={() => setRelatorioAtual(r.texto)}>
                  Ler completo
                </Button>
              )}
            </div>
          ))}
          {historico.length === 0 && <p className="text-sm text-muted-foreground">Nenhum relatório gerado ainda</p>}
        </CardContent>
      </Card>
    </div>
  );
}
