import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, Award, AlertTriangle, BarChart2, LineChart as LineChartIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, Legend
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ChartType = 'bar' | 'line';

const fmtShort = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;
const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

// Defined OUTSIDE component to avoid ref warnings
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmtShort(p.value)}</p>
      ))}
    </div>
  );
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function DiretoriaDashboard() {
  const { profile } = useAuth();
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);
  const [inadimplencia, setInadimplencia] = useState(0);
  const [rankingLojas, setRankingLojas] = useState<{ nome: string; total: number }[]>([]);
  const [lojasSemaforo, setLojasSemaforo] = useState<{ id: string; nome: string; status: 'verde' | 'amarelo' | 'vermelho'; pct: number }[]>([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState<{ mes: string; total: number }[]>([]);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [filterMes, setFilterMes] = useState(new Date().toISOString().slice(0, 7));

  const fetchAll = useCallback(async () => {
    if (!profile?.empresa_id) return;
    const empresaId = profile.empresa_id;

    const { data: lojas } = await supabase.from('lojas').select('id, nome').eq('empresa_id', empresaId).eq('ativa', true);
    if (!lojas) return;

    const { data: fechamentos } = await supabase.from('fechamentos')
      .select('loja_id, total_entradas, data, status')
      .eq('empresa_id', empresaId).is('deleted_at', null)
      .gte('data', `${filterMes}-01`).lte('data', `${filterMes}-31`);

    const total = (fechamentos || []).reduce((sum, f) => sum + (Number(f.total_entradas) || 0), 0);
    setFaturamentoTotal(total);

    const lojaMap: Record<string, number> = {};
    (fechamentos || []).forEach(f => {
      lojaMap[f.loja_id] = (lojaMap[f.loja_id] || 0) + (Number(f.total_entradas) || 0);
    });
    const ranking = lojas.map(l => ({ nome: l.nome, total: lojaMap[l.id] || 0 })).sort((a, b) => b.total - a.total);
    setRankingLojas(ranking);

    const { data: receber } = await supabase.from('contas_receber').select('valor').eq('empresa_id', empresaId).eq('status', 'ATRASADO' as any);
    setInadimplencia((receber || []).reduce((sum, c) => sum + (Number(c.valor) || 0), 0));

    const { data: metas } = await supabase.from('metas').select('loja_id, meta_mensal').eq('empresa_id', empresaId).eq('mes', filterMes);
    const { data: concDiv } = await supabase.from('conciliacoes').select('loja_id').eq('empresa_id', empresaId).eq('status', 'DIVERGENCIA' as any).gte('data', `${filterMes}-01`);
    const divLojas = new Set((concDiv || []).map(c => c.loja_id));

    const semaforo = lojas.map(l => {
      const meta = (metas || []).find(m => m.loja_id === l.id);
      const realizado = lojaMap[l.id] || 0;
      const metaVal = Number(meta?.meta_mensal) || 0;
      const pct = metaVal > 0 ? (realizado / metaVal) * 100 : 0;
      const hasDivergencia = divLojas.has(l.id);
      let status: 'verde' | 'amarelo' | 'vermelho' = 'verde';
      if (hasDivergencia || pct < 50) status = 'vermelho';
      else if (pct < 80) status = 'amarelo';
      return { id: l.id, nome: l.nome, status, pct };
    });
    setLojasSemaforo(semaforo);

    const { data: fechAll } = await supabase.from('fechamentos').select('total_entradas, data').eq('empresa_id', empresaId).is('deleted_at', null).order('data');
    const mesMap: Record<string, number> = {};
    (fechAll || []).forEach(f => {
      const m = (f.data as string).slice(0, 7);
      mesMap[m] = (mesMap[m] || 0) + (Number(f.total_entradas) || 0);
    });
    setEvolucaoMensal(Object.entries(mesMap).slice(-8).map(([mes, total]) => ({
      mes: MESES[parseInt(mes.slice(5, 7)) - 1] + '/' + mes.slice(2, 4),
      total,
    })));
  }, [profile, filterMes]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Generate month options (last 12 months)
  const mesOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = d.toISOString().slice(0, 7);
    return { val, label: `${MESES[d.getMonth()]} ${d.getFullYear()}` };
  });

  const semaforoConfig = { verde: 'bg-emerald-500', amarelo: 'bg-amber-400', vermelho: 'bg-red-500' };
  const semaforoBadge = { verde: 'default' as const, amarelo: 'secondary' as const, vermelho: 'destructive' as const };

  const rankingColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Dashboard Executivo</h1>
        <Select value={filterMes} onValueChange={setFilterMes}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mesOptions.map(o => <SelectItem key={o.val} value={o.val}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">{fmtShort(faturamentoTotal)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{MESES[parseInt(filterMes.slice(5)) - 1]}/{filterMes.slice(2, 4)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-500/10 to-red-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Inadimplência</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">{fmtShort(inadimplencia)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Em atraso</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Lojas OK</CardTitle>
            <Award className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-600">{lojasSemaforo.filter(l => l.status === 'verde').length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">de {lojasSemaforo.length} lojas</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-600">{lojasSemaforo.filter(l => l.status !== 'verde').length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Lojas em atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Ranking */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Ranking por Loja</CardTitle>
              <div className="flex gap-1">
                <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-lg transition-all ${chartType === 'bar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                  <BarChart2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setChartType('line')} className={`p-1.5 rounded-lg transition-all ${chartType === 'line' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                  <LineChartIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={rankingLojas} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="nome" width={90} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Faturamento" radius={[0, 6, 6, 0]}>
                  {rankingLojas.map((_, i) => <Cell key={i} fill={rankingColors[i % rankingColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={230}>
              {chartType === 'line' ? (
                <LineChart data={evolucaoMensal} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="total" name="Faturamento" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <BarChart data={evolucaoMensal} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="total" name="Faturamento" radius={[4, 4, 0, 0]}>
                    {evolucaoMensal.map((_, i) => <Cell key={i} fill={`hsl(${213 + i * 15}, 70%, ${45 + i * 3}%)`} />)}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Semáforo */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Semáforo de Lojas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {lojasSemaforo.map(l => (
              <div key={l.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className={`h-3 w-3 shrink-0 rounded-full ${semaforoConfig[l.status]}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{l.nome}</p>
                  <p className="text-xs text-muted-foreground">{l.pct.toFixed(0)}% da meta</p>
                </div>
              </div>
            ))}
            {lojasSemaforo.length === 0 && <p className="text-sm text-muted-foreground col-span-4">Nenhuma loja cadastrada</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
