import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function LojaDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<{ meta_diaria: number; meta_mensal: number } | null>(null);
  const [realizadoHoje, setRealizadoHoje] = useState(0);
  const [fechamentoStatus, setFechamentoStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.loja_id || !profile?.empresa_id) return;
    const hoje = new Date().toISOString().slice(0, 10);
    const mes = hoje.slice(0, 7);

    const fetchData = async () => {
      const [metaRes, fechRes] = await Promise.all([
        supabase.from('metas').select('meta_diaria, meta_mensal').eq('loja_id', profile.loja_id!).eq('mes', mes).single(),
        supabase.from('fechamentos').select('total_entradas, status').eq('loja_id', profile.loja_id!).eq('data', hoje).is('deleted_at', null).single(),
      ]);
      if (metaRes.data) setMeta(metaRes.data as any);
      if (fechRes.data) {
        setRealizadoHoje(Number(fechRes.data.total_entradas) || 0);
        setFechamentoStatus(fechRes.data.status as string);
      }
    };
    fetchData();
  }, [profile]);

  const pctAtingido = meta?.meta_diaria ? Math.min((realizadoHoje / Number(meta.meta_diaria)) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard da Loja</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus resultados do dia</p>
        </div>
        <Button onClick={() => navigate('/loja/caixa')} className="gap-2">
          <DollarSign className="h-4 w-4" /> Fechar Caixa <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meta Diária</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {meta?.meta_diaria?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '0,00'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Realizado Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {realizadoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">% Atingido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pctAtingido.toFixed(1)}%</div>
            <Progress value={pctAtingido} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Status do Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${
              fechamentoStatus === 'ABERTO' ? 'bg-warning' :
              fechamentoStatus?.startsWith('CONCILIADO_OK') ? 'bg-success' :
              fechamentoStatus?.includes('DIVERGENCIA') ? 'bg-danger' :
              'bg-muted-foreground'
            }`} />
            <span className="text-sm font-medium">{fechamentoStatus ?? 'Sem lançamento hoje'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
