import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Trophy, Pencil, Trash2, Users, CalendarDays, TrendingUp, RefreshCw } from 'lucide-react';
import { exportToExcel } from '@/lib/csv';
import html2canvas from 'html2canvas';

interface Loja { id: string; nome: string; }
interface Funcionario { id: string; loja_id: string; }
interface MetaSemanal {
  id: string; empresa_id: string; loja_id: string;
  semana_inicio: string; semana_fim: string;
  qtd_colaboradores: number; folha_semanal: number;
  contas_pagar_semana: number; custo_total_semana: number;
  meta_faturamento_semana: number; realizado_semana: number;
  margem_seguranca: number;
}

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

function getWeeksOfMonth(year: number, month: number) {
  const weeks: { inicio: Date; fim: Date; label: string }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let current = new Date(firstDay);
  // Adjust to Monday
  const dayOfWeek = current.getDay();
  if (dayOfWeek !== 1) {
    current.setDate(current.getDate() - ((dayOfWeek + 6) % 7));
  }
  
  let weekNum = 1;
  while (current <= lastDay || weekNum <= 4) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(end.getDate() + 6);
    weeks.push({
      inicio: start,
      fim: end,
      label: `Semana ${weekNum} (${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1})`,
    });
    current.setDate(current.getDate() + 7);
    weekNum++;
    if (weekNum > 5) break;
  }
  return weeks;
}

const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function MetasSemanais() {
  const { profile, primaryRole } = useAuth();
  const { toast } = useToast();
  const rankingRef = useRef<HTMLDivElement>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [metas, setMetas] = useState<MetaSemanal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const now = new Date();
  const [filterMes, setFilterMes] = useState(String(now.getMonth()));
  const [filterAno, setFilterAno] = useState(String(now.getFullYear()));

  const [form, setForm] = useState({
    loja_id: '', semana_inicio: '', semana_fim: '',
    folha_semanal: '', contas_pagar_semana: '', margem_seguranca: '20',
  });

  useEffect(() => {
    if (!profile?.empresa_id) return;
    Promise.all([
      supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true),
      supabase.from('funcionarios').select('id, loja_id').eq('empresa_id', profile.empresa_id).eq('ativo', true),
    ]).then(([lojasRes, funcRes]) => {
      if (lojasRes.data) setLojas(lojasRes.data);
      if (funcRes.data) setFuncionarios(funcRes.data as Funcionario[]);
    });
    fetchMetas();
  }, [profile]);

  const fetchMetas = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('metas_semanais').select('*')
      .eq('empresa_id', profile.empresa_id).order('semana_inicio', { ascending: false });
    if (data) setMetas(data as unknown as MetaSemanal[]);
  };

  const getColabCount = (lojaId: string) => funcionarios.filter(f => f.loja_id === lojaId).length;

  const weeks = getWeeksOfMonth(parseInt(filterAno), parseInt(filterMes));

  const filtered = metas.filter(m => {
    const d = new Date(m.semana_inicio);
    return d.getMonth() === parseInt(filterMes) && d.getFullYear() === parseInt(filterAno);
  });

  const resetForm = () => {
    setForm({ loja_id: '', semana_inicio: '', semana_fim: '', folha_semanal: '', contas_pagar_semana: '', margem_seguranca: '20' });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id || !form.loja_id || !form.semana_inicio) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' }); return;
    }
    const folha = parseFloat(form.folha_semanal) || 0;
    const contas = parseFloat(form.contas_pagar_semana) || 0;
    const margem = parseFloat(form.margem_seguranca) || 20;
    const custoTotal = folha + contas;
    const metaFat = custoTotal * (1 + margem / 100);

    const payload = {
      empresa_id: profile.empresa_id,
      loja_id: form.loja_id,
      semana_inicio: form.semana_inicio,
      semana_fim: form.semana_fim,
      qtd_colaboradores: getColabCount(form.loja_id),
      folha_semanal: folha,
      contas_pagar_semana: contas,
      custo_total_semana: custoTotal,
      meta_faturamento_semana: metaFat,
      margem_seguranca: margem,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('metas_semanais').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('metas_semanais').insert(payload));
    }
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: editId ? 'Meta atualizada!' : 'Meta cadastrada!' });
      setDialogOpen(false); resetForm(); fetchMetas();
    }
  };

  const handleEdit = (m: MetaSemanal) => {
    setEditId(m.id);
    setForm({
      loja_id: m.loja_id,
      semana_inicio: m.semana_inicio,
      semana_fim: m.semana_fim,
      folha_semanal: String(m.folha_semanal),
      contas_pagar_semana: String(m.contas_pagar_semana),
      margem_seguranca: String(m.margem_seguranca),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('metas_semanais').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Meta excluída!' }); fetchMetas(); }
  };

  // Auto-generate weekly goals for all stores
  const handleAutoGenerate = async () => {
    if (!profile?.empresa_id) return;
    setGenerating(true);
    try {
      // Get folha per store
      const { data: funcData } = await supabase.from('funcionarios')
        .select('loja_id, salario, passagem, ajuda_custo')
        .eq('empresa_id', profile.empresa_id).eq('ativo', true);

      // Get contas a pagar per store for the month
      const mesNum = parseInt(filterMes) + 1;
      const anoNum = parseInt(filterAno);
      const mesStr = `${anoNum}-${String(mesNum).padStart(2, '0')}`;
      
      const { data: contasData } = await supabase.from('contas_pagar')
        .select('loja_id, valor')
        .eq('empresa_id', profile.empresa_id)
        .gte('vencimento', `${mesStr}-01`)
        .lte('vencimento', `${mesStr}-31`);

      // Calculate per store
      const folhaPorLoja: Record<string, number> = {};
      const contasPorLoja: Record<string, number> = {};
      
      funcData?.forEach(f => {
        const total = Number(f.salario) + Number(f.passagem) + Number(f.ajuda_custo);
        folhaPorLoja[f.loja_id] = (folhaPorLoja[f.loja_id] || 0) + total;
      });
      
      contasData?.forEach(c => {
        contasPorLoja[c.loja_id] = (contasPorLoja[c.loja_id] || 0) + Number(c.valor);
      });

      const numWeeks = weeks.length;
      let inserted = 0;

      for (const loja of lojas) {
        const folhaMensal = folhaPorLoja[loja.id] || 0;
        const contasMensal = contasPorLoja[loja.id] || 0;
        const folhaSemanal = folhaMensal / numWeeks;
        const contasSemanal = contasMensal / numWeeks;
        const custoTotal = folhaSemanal + contasSemanal;
        const metaFat = custoTotal * 1.20; // 20% margin

        for (const week of weeks) {
          const inicio = week.inicio.toISOString().slice(0, 10);
          const fim = week.fim.toISOString().slice(0, 10);
          
          // Check if already exists
          const exists = metas.some(m => m.loja_id === loja.id && m.semana_inicio === inicio);
          if (exists) continue;

          const { error } = await supabase.from('metas_semanais').insert({
            empresa_id: profile.empresa_id,
            loja_id: loja.id,
            semana_inicio: inicio,
            semana_fim: fim,
            qtd_colaboradores: getColabCount(loja.id),
            folha_semanal: Math.round(folhaSemanal * 100) / 100,
            contas_pagar_semana: Math.round(contasSemanal * 100) / 100,
            custo_total_semana: Math.round(custoTotal * 100) / 100,
            meta_faturamento_semana: Math.round(metaFat * 100) / 100,
            margem_seguranca: 20,
          });
          if (!error) inserted++;
        }
      }
      toast({ title: `${inserted} metas semanais geradas!` });
      fetchMetas();
    } catch (err) {
      toast({ title: 'Erro ao gerar metas', variant: 'destructive' });
    }
    setGenerating(false);
  };

  // Ranking: sort stores by % achieved (descending)
  const ranking = lojas.map(loja => {
    const lojaMetasWeek = filtered.filter(m => m.loja_id === loja.id);
    const totalMeta = lojaMetasWeek.reduce((s, m) => s + Number(m.meta_faturamento_semana), 0);
    const totalRealizado = lojaMetasWeek.reduce((s, m) => s + Number(m.realizado_semana), 0);
    const totalCusto = lojaMetasWeek.reduce((s, m) => s + Number(m.custo_total_semana), 0);
    const pct = totalMeta > 0 ? Math.round((totalRealizado / totalMeta) * 100) : 0;
    const sobra = totalRealizado - totalCusto;
    return {
      loja, qtdColab: getColabCount(loja.id),
      totalMeta, totalRealizado, totalCusto, pct, sobra,
      semanas: lojaMetasWeek.length,
    };
  }).filter(r => r.semanas > 0).sort((a, b) => b.pct - a.pct);

  const handleExportRanking = () => {
    const data = ranking.map((r, i) => ({
      posicao: i + 1,
      loja: r.loja.nome,
      colaboradores: r.qtdColab,
      meta_semanal_total: Number(r.totalMeta).toFixed(2),
      realizado: Number(r.totalRealizado).toFixed(2),
      custo_total: Number(r.totalCusto).toFixed(2),
      sobra_caixa: Number(r.sobra).toFixed(2),
      percentual: `${r.pct}%`,
    }));
    exportToExcel(data, `ranking_semanal_${meses[parseInt(filterMes)]}_${filterAno}`, [
      { key: 'posicao', label: 'Posição' },
      { key: 'loja', label: 'Loja' },
      { key: 'colaboradores', label: 'Colaboradores' },
      { key: 'meta_semanal_total', label: 'Meta Total (R$)' },
      { key: 'realizado', label: 'Realizado (R$)' },
      { key: 'custo_total', label: 'Custo Total (R$)' },
      { key: 'sobra_caixa', label: 'Sobra em Caixa (R$)' },
      { key: 'percentual', label: '% Atingido' },
    ]);
  };

  const handleExportImage = async () => {
    if (!rankingRef.current) return;
    const canvas = await html2canvas(rankingRef.current, { backgroundColor: '#1a1a2e' });
    const link = document.createElement('a');
    link.download = `ranking_semanal_${meses[parseInt(filterMes)]}_${filterAno}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const medals = ['🥇', '🥈', '🥉'];

  const handleSelectWeek = (weekIdx: string) => {
    const week = weeks[parseInt(weekIdx)];
    if (week) {
      setForm(p => ({
        ...p,
        semana_inicio: week.inicio.toISOString().slice(0, 10),
        semana_fim: week.fim.toISOString().slice(0, 10),
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Metas Semanais por Loja</h1>
          <p className="text-sm text-muted-foreground">Custos + Folha + 20% margem mínima em caixa</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleAutoGenerate} disabled={generating} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} /> Gerar Automático
          </Button>
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Meta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Editar Meta Semanal' : 'Nova Meta Semanal'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Loja</Label>
                  <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{lojas.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.nome} ({getColabCount(l.id)} colab.)</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Semana</Label>
                  <Select onValueChange={handleSelectWeek}>
                    <SelectTrigger><SelectValue placeholder="Selecione a semana" /></SelectTrigger>
                    <SelectContent>{weeks.map((w, i) => (
                      <SelectItem key={i} value={String(i)}>{w.label}</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Folha Semanal (R$)</Label>
                    <Input type="number" step="0.01" value={form.folha_semanal} onChange={e => setForm(p => ({ ...p, folha_semanal: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contas a Pagar (R$)</Label>
                    <Input type="number" step="0.01" value={form.contas_pagar_semana} onChange={e => setForm(p => ({ ...p, contas_pagar_semana: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Margem (%)</Label>
                    <Input type="number" step="1" value={form.margem_seguranca} onChange={e => setForm(p => ({ ...p, margem_seguranca: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">{editId ? 'Salvar' : 'Cadastrar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterMes} onValueChange={setFilterMes}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>{meses.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterAno} onValueChange={setFilterAno}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><CalendarDays className="h-4 w-4" /> Semanas</div>
              <p className="text-2xl font-bold">{new Set(filtered.map(m => m.semana_inicio)).size}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><TrendingUp className="h-4 w-4" /> Meta Total</div>
              <p className="text-2xl font-bold">{fmt(filtered.reduce((s, m) => s + Number(m.meta_faturamento_semana), 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Trophy className="h-4 w-4" /> Realizado</div>
              <p className="text-2xl font-bold">{fmt(filtered.reduce((s, m) => s + Number(m.realizado_semana), 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Users className="h-4 w-4" /> Lojas c/ Meta</div>
              <p className="text-2xl font-bold">{new Set(filtered.map(m => m.loja_id)).size}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weekly meta cards per store */}
      <div className="space-y-4">
        {weeks.map((week, wi) => {
          const weekMetas = filtered.filter(m => m.semana_inicio === week.inicio.toISOString().slice(0, 10));
          if (weekMetas.length === 0) return null;
          return (
            <Card key={wi}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" /> {week.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weekMetas.map(m => {
                  const loja = lojas.find(l => l.id === m.loja_id);
                  const pct = m.meta_faturamento_semana > 0 ? Math.round((Number(m.realizado_semana) / Number(m.meta_faturamento_semana)) * 100) : 0;
                  return (
                    <div key={m.id} className="flex items-center gap-4 border rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{loja?.nome}</span>
                          <Badge variant="outline" className="text-xs gap-1"><Users className="h-3 w-3" />{m.qtd_colaboradores}</Badge>
                          <Badge variant={pct >= 100 ? 'default' : pct >= 50 ? 'secondary' : 'destructive'}>{pct}%</Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                          <span>Folha: {fmt(Number(m.folha_semanal))}</span>
                          <span>Contas: {fmt(Number(m.contas_pagar_semana))}</span>
                          <span>Custo: {fmt(Number(m.custo_total_semana))}</span>
                          <span className="font-semibold text-primary">Meta: {fmt(Number(m.meta_faturamento_semana))}</span>
                        </div>
                        <Progress value={Math.min(pct, 100)} className="h-1.5 mt-2" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}><Pencil className="h-4 w-4" /></Button>
                        {primaryRole === 'ADMIN' && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma meta semanal para este período. Clique em "Gerar Automático" para criar.
          </p>
        )}
      </div>

      {/* Ranking */}
      {ranking.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-warning" /> Ranking por Loja — {meses[parseInt(filterMes)]} {filterAno}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportRanking} className="gap-1"><Download className="h-4 w-4" /> Excel</Button>
              <Button variant="outline" size="sm" onClick={handleExportImage} className="gap-1"><Download className="h-4 w-4" /> PNG</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={rankingRef} className="rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">#</th>
                    <th className="p-2">Loja</th>
                    <th className="p-2 text-center">Colab.</th>
                    <th className="p-2 text-right">Meta</th>
                    <th className="p-2 text-right">Realizado</th>
                    <th className="p-2 text-right">Custo</th>
                    <th className="p-2 text-right">Sobra Caixa</th>
                    <th className="p-2 text-center">%</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => (
                    <tr key={r.loja.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-2 text-lg">{medals[i] || `${i + 1}º`}</td>
                      <td className="p-2 font-medium">{r.loja.nome}</td>
                      <td className="p-2 text-center">{r.qtdColab}</td>
                      <td className="p-2 text-right">{fmt(r.totalMeta)}</td>
                      <td className="p-2 text-right">{fmt(r.totalRealizado)}</td>
                      <td className="p-2 text-right">{fmt(r.totalCusto)}</td>
                      <td className={`p-2 text-right font-semibold ${r.sobra >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {fmt(r.sobra)}
                      </td>
                      <td className="p-2 text-center">
                        <Badge variant={r.pct >= 100 ? 'default' : r.pct >= 50 ? 'secondary' : 'destructive'}>{r.pct}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
