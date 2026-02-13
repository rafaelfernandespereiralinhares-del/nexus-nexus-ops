import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { exportToExcel } from '@/lib/csv';
import { useToast } from '@/hooks/use-toast';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CATEGORIA_ORDER = ['RECEITAS','DEDUCOES','CMV','DESPESAS_VENDAS','DESPESAS_FIXAS','DESPESAS_VARIAVEIS','RESULTADO'];

const CATEGORIA_LABELS: Record<string, string> = {
  RECEITAS: '📈 RECEITAS',
  DEDUCOES: '📉 DEDUÇÕES SOBRE RECEITA',
  CMV: '🏭 CUSTO DA MERCADORIA VENDIDA',
  DESPESAS_VENDAS: '🛒 DESPESAS COM VENDAS',
  DESPESAS_FIXAS: '🏢 DESPESAS FIXAS',
  DESPESAS_VARIAVEIS: '📦 DESPESAS VARIÁVEIS',
  RESULTADO: '💰 RESULTADO',
};

const SUB_LABELS: Record<string, string> = {
  RECEITA_ACESSORIOS: 'Receita de Acessórios',
  RECEITA_APARELHOS: 'Receita de Aparelhos',
  RECEITA_ASSISTENCIA: 'Receita de Assistência',
  DAS_SIMPLES: 'DAS Simples Nacional',
  GPS: 'GPS',
  FGTS: 'FGTS',
  CMV_ACESSORIOS: 'CMV de Acessórios',
  CMV_APARELHOS: 'CMV de Aparelhos',
  CMV_ASSISTENCIA: 'CMV de Assistência',
  COMISSAO_VENDAS: 'Comissão de Vendas',
  TAXA_CARTAO: 'Taxa de Cartão',
  ALUGUEL: 'Aluguel',
  SALARIOS_EQUIPE_MANTIQUEIRA: 'Salários - Equipe Mantiqueira',
  SALARIOS_EQUIPE_REDE: 'Salários - Equipe Rede',
  SISTEMA: 'Sistema',
  PASSAGEM: 'Passagem',
  CONTABILIDADE: 'Contabilidade',
  PRO_LABORE: 'Pró-Labore',
  LUZ: 'Luz',
  INTERNET: 'Internet',
  MATERIAL_ESCRITORIO: 'Material de Escritório',
  EMBALAGENS: 'Embalagens',
  DESPESAS_MOTO: 'Despesas da Moto',
  MARKETING: 'Marketing',
  LUCRO_LIQUIDO: 'Lucro Líquido',
};

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface DreRow {
  categoria: string;
  subcategoria: string;
  valores: number[];
  percentuais: number[];
  total: number;
}

function buildDreRows(data: any[]): DreRow[] {
  const grouped = new Map<string, Map<string, { valores: number[]; percentuais: number[] }>>();
  for (const row of data) {
    if (!grouped.has(row.categoria)) grouped.set(row.categoria, new Map());
    const catMap = grouped.get(row.categoria)!;
    if (!catMap.has(row.subcategoria)) {
      catMap.set(row.subcategoria, { valores: Array(12).fill(0), percentuais: Array(12).fill(0) });
    }
    const entry = catMap.get(row.subcategoria)!;
    entry.valores[row.mes - 1] = Number(row.valor);
    entry.percentuais[row.mes - 1] = Number(row.percentual);
  }
  const result: DreRow[] = [];
  for (const cat of CATEGORIA_ORDER) {
    const catMap = grouped.get(cat);
    if (!catMap) continue;
    for (const [sub, entry] of catMap) {
      result.push({
        categoria: cat,
        subcategoria: sub,
        valores: entry.valores,
        percentuais: entry.percentuais,
        total: entry.valores.reduce((a, b) => a + b, 0),
      });
    }
  }
  return result;
}

export default function PlanejamentoEstrategico() {
  const { toast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [compareData, setCompareData] = useState<any[]>([]);
  const [anos, setAnos] = useState<number[]>([]);
  const [lojas, setLojas] = useState<string[]>([]);
  const [anoSel, setAnoSel] = useState<string>('');
  const [anoCompare, setAnoCompare] = useState<string>('');
  const [lojaSel, setLojaSel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFilters(); }, []);

  useEffect(() => {
    if (anoSel && lojaSel) fetchDre();
  }, [anoSel, lojaSel]);

  useEffect(() => {
    if (anoCompare && lojaSel) fetchCompareDre();
    else setCompareData([]);
  }, [anoCompare, lojaSel]);

  const fetchFilters = async () => {
    const { data: rows } = await supabase.from('dre_historico').select('ano, loja_nome');
    if (rows) {
      const uniqueAnos = [...new Set(rows.map(r => r.ano))].sort((a, b) => b - a);
      const uniqueLojas = [...new Set(rows.map(r => r.loja_nome))].sort();
      setAnos(uniqueAnos);
      setLojas(uniqueLojas);
      if (uniqueAnos.length) setAnoSel(String(uniqueAnos[0]));
      setLojaSel('__TODAS__');
    }
    setLoading(false);
  };

  const fetchDre = async () => {
    let query = supabase.from('dre_historico').select('*').eq('ano', Number(anoSel)).order('mes');
    if (lojaSel !== '__TODAS__') query = query.eq('loja_nome', lojaSel);
    const { data: rows } = await query;
    if (rows) {
      if (lojaSel === '__TODAS__') {
        // Consolidate all stores by summing values per categoria/subcategoria/mes
        const map = new Map<string, any>();
        for (const row of rows) {
          const key = `${row.categoria}_${row.subcategoria}_${row.mes}`;
          if (!map.has(key)) {
            map.set(key, { ...row, valor: Number(row.valor), percentual: Number(row.percentual), loja_nome: 'Todas as Lojas' });
          } else {
            const existing = map.get(key)!;
            existing.valor += Number(row.valor);
          }
        }
        setData(Array.from(map.values()));
      } else {
        setData(rows);
      }
    }
  };

  const fetchCompareDre = async () => {
    let query = supabase.from('dre_historico').select('*').eq('ano', Number(anoCompare)).order('mes');
    if (lojaSel !== '__TODAS__') query = query.eq('loja_nome', lojaSel);
    const { data: rows } = await query;
    if (rows) {
      if (lojaSel === '__TODAS__') {
        const map = new Map<string, any>();
        for (const row of rows) {
          const key = `${row.categoria}_${row.subcategoria}_${row.mes}`;
          if (!map.has(key)) {
            map.set(key, { ...row, valor: Number(row.valor), percentual: Number(row.percentual) });
          } else {
            map.get(key)!.valor += Number(row.valor);
          }
        }
        setCompareData(Array.from(map.values()));
      } else {
        setCompareData(rows);
      }
    }
  };

  const dreRows = buildDreRows(data);
  const compareDreRows = buildDreRows(compareData);

  // Chart data
  const chartData = MESES.map((m, i) => {
    const receita = dreRows.filter(r => r.categoria === 'RECEITAS').reduce((s, r) => s + r.valores[i], 0);
    const despFixas = dreRows.filter(r => r.categoria === 'DESPESAS_FIXAS').reduce((s, r) => s + r.valores[i], 0);
    const despVar = dreRows.filter(r => r.categoria === 'DESPESAS_VARIAVEIS').reduce((s, r) => s + r.valores[i], 0);
    const lucro = dreRows.filter(r => r.subcategoria === 'LUCRO_LIQUIDO').reduce((s, r) => s + r.valores[i], 0);
    return { mes: m, receita, despesas: despFixas + despVar, lucro };
  });

  // YoY chart data
  const yoyData = anoCompare ? MESES.map((m, i) => {
    const receitaAtual = dreRows.filter(r => r.categoria === 'RECEITAS').reduce((s, r) => s + r.valores[i], 0);
    const lucroAtual = dreRows.filter(r => r.subcategoria === 'LUCRO_LIQUIDO').reduce((s, r) => s + r.valores[i], 0);
    const receitaAnterior = compareDreRows.filter(r => r.categoria === 'RECEITAS').reduce((s, r) => s + r.valores[i], 0);
    const lucroAnterior = compareDreRows.filter(r => r.subcategoria === 'LUCRO_LIQUIDO').reduce((s, r) => s + r.valores[i], 0);
    return { mes: m, [`Receita ${anoSel}`]: receitaAtual, [`Receita ${anoCompare}`]: receitaAnterior, [`Lucro ${anoSel}`]: lucroAtual, [`Lucro ${anoCompare}`]: lucroAnterior };
  }) : [];

  // KPIs
  const totalReceita = dreRows.filter(r => r.categoria === 'RECEITAS').reduce((s, r) => s + r.total, 0);
  const totalLucro = dreRows.filter(r => r.subcategoria === 'LUCRO_LIQUIDO').reduce((s, r) => s + r.total, 0);
  const totalDespFixas = dreRows.filter(r => r.categoria === 'DESPESAS_FIXAS').reduce((s, r) => s + r.total, 0);
  const margemLucro = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;

  // YoY KPIs
  const totalReceitaCompare = compareDreRows.filter(r => r.categoria === 'RECEITAS').reduce((s, r) => s + r.total, 0);
  const totalLucroCompare = compareDreRows.filter(r => r.subcategoria === 'LUCRO_LIQUIDO').reduce((s, r) => s + r.total, 0);
  const varReceita = totalReceitaCompare > 0 ? ((totalReceita - totalReceitaCompare) / totalReceitaCompare) * 100 : 0;
  const varLucro = totalLucroCompare !== 0 ? ((totalLucro - totalLucroCompare) / Math.abs(totalLucroCompare)) * 100 : 0;

  const handleExport = () => {
    const exportData = dreRows.map(r => {
      const row: any = {
        categoria: CATEGORIA_LABELS[r.categoria] || r.categoria,
        subcategoria: SUB_LABELS[r.subcategoria] || r.subcategoria,
      };
      MESES.forEach((m, i) => { row[m] = r.valores[i]; });
      row['Total Anual'] = r.total;
      return row;
    });
    const cols = [
      { key: 'categoria', label: 'Categoria' },
      { key: 'subcategoria', label: 'Subcategoria' },
      ...MESES.map(m => ({ key: m, label: m })),
      { key: 'Total Anual', label: 'Total Anual' },
    ];
    exportToExcel(exportData, `DRE_${lojaSel}_${anoSel}`, cols);
    toast({ title: 'DRE exportado com sucesso!' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold">Planejamento Estratégico — DRE Histórico</h1>
        <div className="flex flex-wrap gap-2">
          <Select value={lojaSel} onValueChange={setLojaSel}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Loja" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__TODAS__">📊 Todas as Lojas</SelectItem>
              {lojas.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={anoSel} onValueChange={setAnoSel}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>{anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={anoCompare} onValueChange={setAnoCompare}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Comparar com..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem comparação</SelectItem>
              {anos.filter(a => String(a) !== anoSel).map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={dreRows.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita Total Anual</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{fmt(totalReceita)}</p>
            {anoCompare && anoCompare !== 'none' && totalReceitaCompare > 0 && (
              <p className={`text-xs mt-1 ${varReceita >= 0 ? 'text-success' : 'text-destructive'}`}>
                {varReceita >= 0 ? '▲' : '▼'} {Math.abs(varReceita).toFixed(1)}% vs {anoCompare}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lucro Líquido Anual</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalLucro >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(totalLucro)}</p>
            {anoCompare && anoCompare !== 'none' && totalLucroCompare !== 0 && (
              <p className={`text-xs mt-1 ${varLucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                {varLucro >= 0 ? '▲' : '▼'} {Math.abs(varLucro).toFixed(1)}% vs {anoCompare}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Margem de Lucro</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {margemLucro >= 20 ? <TrendingUp className="h-5 w-5 text-success" /> :
               margemLucro >= 0 ? <Minus className="h-5 w-5 text-warning" /> :
               <TrendingDown className="h-5 w-5 text-destructive" />}
              <p className={`text-2xl font-bold ${margemLucro >= 20 ? 'text-success' : margemLucro >= 0 ? 'text-warning' : 'text-destructive'}`}>
                {margemLucro.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Despesas Fixas / Receita</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">
              {totalReceita > 0 ? ((totalDespFixas / totalReceita) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* YoY Comparison Chart */}
      {anoCompare && anoCompare !== 'none' && yoyData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Comparação Ano a Ano — {anoSel} vs {anoCompare}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={yoyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey={`Receita ${anoSel}`} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey={`Receita ${anoCompare}`} fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
                <Bar dataKey={`Lucro ${anoSel}`} fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey={`Lucro ${anoCompare}`} fill="hsl(var(--success) / 0.4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Evolution Chart */}
      <Card>
        <CardHeader><CardTitle>Evolução Mensal — Receita × Despesas × Lucro</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="receita" name="Receita" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--destructive))" strokeWidth={2} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(var(--success))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* DRE Table */}
      <Card>
        <CardHeader><CardTitle>DRE Completo — {lojaSel === '__TODAS__' ? 'Todas as Lojas' : lojaSel} — {anoSel}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">Conta</TableHead>
                {MESES.map(m => <TableHead key={m} className="text-right min-w-[100px]">{m}</TableHead>)}
                <TableHead className="text-right min-w-[120px] font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                let lastCat = '';
                return dreRows.map((row, idx) => {
                  const showHeader = row.categoria !== lastCat;
                  lastCat = row.categoria;
                  const isResult = row.categoria === 'RESULTADO';
                  return (
                    <>{showHeader && (
                      <TableRow key={`header-${row.categoria}`} className="bg-muted/50">
                        <TableCell colSpan={14} className="font-bold text-sm py-2">
                          {CATEGORIA_LABELS[row.categoria] || row.categoria}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow key={idx} className={isResult ? 'font-bold bg-muted/30' : ''}>
                      <TableCell className="pl-6 sticky left-0 bg-background z-10">
                        {SUB_LABELS[row.subcategoria] || row.subcategoria}
                      </TableCell>
                      {row.valores.map((v, i) => (
                        <TableCell key={i} className={`text-right tabular-nums ${v < 0 ? 'text-destructive' : ''}`}>
                          {fmt(v)}
                        </TableCell>
                      ))}
                      <TableCell className={`text-right font-bold tabular-nums ${row.total < 0 ? 'text-destructive' : ''}`}>
                        {fmt(row.total)}
                      </TableCell>
                    </TableRow></>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Profit bar chart */}
      <Card>
        <CardHeader><CardTitle>Lucro Líquido Mensal</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="lucro" name="Lucro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
