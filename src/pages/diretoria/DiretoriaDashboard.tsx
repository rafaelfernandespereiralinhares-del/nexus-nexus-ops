import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function DiretoriaDashboard() {
  const { profile } = useAuth();
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);
  const [inadimplencia, setInadimplencia] = useState(0);
  const [rankingLojas, setRankingLojas] = useState<{ nome: string; total: number }[]>([]);
  const [lojasSemaforo, setLojasSemaforo] = useState<{ id: string; nome: string; status: 'verde' | 'amarelo' | 'vermelho' }[]>([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState<{ mes: string; total: number }[]>([]);

  useEffect(() => {
    if (!profile?.empresa_id) return;
    const empresaId = profile.empresa_id;

    const fetchAll = async () => {
      // Lojas
      const { data: lojas } = await supabase.from('lojas').select('id, nome').eq('empresa_id', empresaId).eq('ativa', true);
      if (!lojas) return;

      // Fechamentos do mês atual
      const mesAtual = new Date().toISOString().slice(0, 7);
      const { data: fechamentos } = await supabase.from('fechamentos').select('loja_id, total_entradas, data, status')
        .eq('empresa_id', empresaId).is('deleted_at', null).gte('data', `${mesAtual}-01`);

      // Faturamento total
      const total = (fechamentos || []).reduce((sum, f) => sum + (Number(f.total_entradas) || 0), 0);
      setFaturamentoTotal(total);

      // Ranking por loja
      const lojaMap: Record<string, number> = {};
      (fechamentos || []).forEach(f => {
        lojaMap[f.loja_id] = (lojaMap[f.loja_id] || 0) + (Number(f.total_entradas) || 0);
      });
      const ranking = lojas.map(l => ({ nome: l.nome, total: lojaMap[l.id] || 0 }))
        .sort((a, b) => b.total - a.total);
      setRankingLojas(ranking);

      // Inadimplência
      const { data: receber } = await supabase.from('contas_receber').select('valor, status')
        .eq('empresa_id', empresaId).eq('status', 'ATRASADO' as any);
      setInadimplencia((receber || []).reduce((sum, c) => sum + (Number(c.valor) || 0), 0));

      // Metas
      const { data: metas } = await supabase.from('metas').select('loja_id, meta_mensal')
        .eq('empresa_id', empresaId).eq('mes', mesAtual);

      // Conciliações divergentes
      const { data: concDiv } = await supabase.from('conciliacoes').select('loja_id')
        .eq('empresa_id', empresaId).eq('status', 'DIVERGENCIA' as any).gte('data', `${mesAtual}-01`);
      const divLojas = new Set((concDiv || []).map(c => c.loja_id));

      // Semáforo
      const semaforo = lojas.map(l => {
        const metaLoja = (metas || []).find(m => m.loja_id === l.id);
        const realizado = lojaMap[l.id] || 0;
        const metaVal = Number(metaLoja?.meta_mensal) || 0;
        const pct = metaVal > 0 ? realizado / metaVal : 0;
        const hasDivergencia = divLojas.has(l.id);

        let status: 'verde' | 'amarelo' | 'vermelho' = 'verde';
        if (hasDivergencia || pct < 0.5) status = 'vermelho';
        else if (pct < 0.8) status = 'amarelo';

        return { id: l.id, nome: l.nome, status };
      });
      setLojasSemaforo(semaforo);

      // Evolução mensal (últimos 6 meses)
      const { data: fechAll } = await supabase.from('fechamentos').select('total_entradas, data')
        .eq('empresa_id', empresaId).is('deleted_at', null).order('data', { ascending: true });
      const mesMap: Record<string, number> = {};
      (fechAll || []).forEach(f => {
        const m = (f.data as string).slice(0, 7);
        mesMap[m] = (mesMap[m] || 0) + (Number(f.total_entradas) || 0);
      });
      setEvolucaoMensal(Object.entries(mesMap).slice(-6).map(([mes, total]) => ({ mes, total })));
    };

    fetchAll();
  }, [profile]);

  const semaforoColor = (s: string) => s === 'verde' ? 'bg-success' : s === 'amarelo' ? 'bg-warning' : 'bg-danger';

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard Executivo</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inadimplência</CardTitle>
            <TrendingDown className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">R$ {inadimplencia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Estimado</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">—</div>
            <p className="text-xs text-muted-foreground">Em breve</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem Média</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">—</div>
            <p className="text-xs text-muted-foreground">Em breve</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ranking */}
        <Card>
          <CardHeader><CardTitle>Ranking por Loja</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rankingLojas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" width={100} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Bar dataKey="total" fill="hsl(213, 70%, 14%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução */}
        <Card>
          <CardHeader><CardTitle>Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Line type="monotone" dataKey="total" stroke="hsl(213, 70%, 14%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Semáforo */}
      <Card>
        <CardHeader><CardTitle>Semáforo de Lojas</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {lojasSemaforo.map(l => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border p-3">
                <div className={`h-3 w-3 rounded-full ${semaforoColor(l.status)}`} />
                <span className="text-sm font-medium">{l.nome}</span>
              </div>
            ))}
            {lojasSemaforo.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma loja cadastrada</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
