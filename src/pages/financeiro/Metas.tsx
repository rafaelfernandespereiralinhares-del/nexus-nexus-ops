import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Upload, Trophy, Pencil, Trash2 } from 'lucide-react';
import { exportToCSV, exportToExcel, parseCSV, parseExcel } from '@/lib/csv';

interface Loja { id: string; nome: string; }

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function Metas() {
  const { profile, primaryRole } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const now = new Date();
  const [filterMes, setFilterMes] = useState(String(now.getMonth()));
  const [filterAno, setFilterAno] = useState(String(now.getFullYear()));
  const [form, setForm] = useState({ loja_id: '', mes: now.toISOString().slice(0, 7), meta_mensal: '', meta_diaria: '', meta_lucro: '' });

  const [fechamentos, setFechamentos] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    fetchMetas();
    fetchFechamentos();
  }, [profile]);

  const fetchMetas = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('metas').select('*').eq('empresa_id', profile.empresa_id).order('mes', { ascending: false });
    if (data) setMetas(data);
  };

  const fetchFechamentos = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('fechamentos').select('loja_id, data, dinheiro, pix, cartao')
      .eq('empresa_id', profile.empresa_id).is('deleted_at', null);
    if (data) setFechamentos(data);
  };

  // Calculate realizado from fechamentos for a given loja/month
  const getRealizadoForMeta = (lojaId: string, mes: string) => {
    // mes is in format "2025-09"
    return fechamentos
      .filter(f => f.loja_id === lojaId && f.data?.startsWith(mes))
      .reduce((sum, f) => sum + Number(f.dinheiro || 0) + Number(f.pix || 0) + Number(f.cartao || 0), 0);
  };

  const resetForm = () => {
    setForm({ loja_id: '', mes: now.toISOString().slice(0, 7), meta_mensal: '', meta_diaria: '', meta_lucro: '' });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id || !form.loja_id) { toast({ title: 'Selecione a loja', variant: 'destructive' }); return; }
    const payload = {
      empresa_id: profile.empresa_id,
      loja_id: form.loja_id,
      mes: form.mes,
      meta_mensal: parseFloat(form.meta_mensal) || 0,
      meta_diaria: parseFloat(form.meta_diaria) || 0,
      meta_lucro: parseFloat(form.meta_lucro) || 0,
    };
    let error;
    if (editId) {
      ({ error } = await supabase.from('metas').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('metas').insert(payload));
    }
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: editId ? 'Meta atualizada!' : 'Meta cadastrada!' });
      setDialogOpen(false);
      resetForm();
      fetchMetas();
    }
  };

  const handleEdit = (m: any) => {
    setEditId(m.id);
    setForm({
      loja_id: m.loja_id,
      mes: m.mes,
      meta_mensal: String(m.meta_mensal),
      meta_diaria: String(m.meta_diaria),
      meta_lucro: String(m.meta_lucro),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Soft approach: we just delete since RLS handles permissions
    const { error } = await supabase.from('metas').delete().eq('id', id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Meta excluída!' }); fetchMetas(); }
  };

  const mesStr = `${filterAno}-${String(parseInt(filterMes) + 1).padStart(2, '0')}`;
  const filtered = metas.filter(m => m.mes === mesStr);

  const handleExport = () => {
    const data = metas.map(m => ({
      mes: m.mes, loja: lojas.find(l => l.id === m.loja_id)?.nome ?? '-',
      meta_mensal: Number(m.meta_mensal).toFixed(2), meta_diaria: Number(m.meta_diaria).toFixed(2),
    }));
    exportToCSV(data, 'metas', [{ key: 'mes', label: 'Mês' }, { key: 'loja', label: 'Loja' }, { key: 'meta_mensal', label: 'Meta Mensal' }, { key: 'meta_diaria', label: 'Meta Diária' }]);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.empresa_id) return;
    let rows: Record<string, string>[];
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      ({ rows } = parseExcel(buffer));
    } else {
      const text = await file.text();
      ({ rows } = parseCSV(text));
    }
    let imported = 0;
    for (const row of rows) {
      const mesVal = row['Mês'] || row['mes'] || row['Mes'];
      const lojaNome = row['Loja'] || row['loja'];
      const metaMensalVal = parseFloat((row['Meta Mensal'] || row['meta_mensal'] || '0').replace(',', '.'));
      const metaDiariaVal = parseFloat((row['Meta Diária'] || row['meta_diaria'] || '0').replace(',', '.'));
      const loja = lojas.find(l => l.nome.toLowerCase() === lojaNome?.toLowerCase());
      if (!mesVal || !loja) continue;
      const { error } = await supabase.from('metas').insert({
        empresa_id: profile.empresa_id, loja_id: loja.id, mes: mesVal,
        meta_mensal: metaMensalVal, meta_diaria: metaDiariaVal,
      });
      if (!error) imported++;
    }
    toast({ title: `${imported} metas importadas` });
    if (fileRef.current) fileRef.current.value = '';
    fetchMetas();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Metas por Loja</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento de faturamento e lucro</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={metas.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Meta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Editar Meta' : 'Nova Meta'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Loja</Label>
                  <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Mês</Label>
                  <Input type="month" value={form.mes} onChange={e => setForm(p => ({ ...p, mes: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Meta Mensal (R$)</Label>
                    <Input type="number" step="0.01" value={form.meta_mensal} onChange={e => setForm(p => ({ ...p, meta_mensal: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta Diária (R$)</Label>
                    <Input type="number" step="0.01" value={form.meta_diaria} onChange={e => setForm(p => ({ ...p, meta_diaria: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta Lucro (R$)</Label>
                    <Input type="number" step="0.01" value={form.meta_lucro} onChange={e => setForm(p => ({ ...p, meta_lucro: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">{editId ? 'Salvar Alterações' : 'Cadastrar'}</Button>
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
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Meta cards */}
      <div className="space-y-4">
        {filtered.map((m, idx) => {
          const loja = lojas.find(l => l.id === m.loja_id);
          const realizadoFat = getRealizadoForMeta(m.loja_id, m.mes);
          const fatPct = m.meta_mensal > 0 ? Math.round((realizadoFat / Number(m.meta_mensal)) * 100) : 0;
          const lucroPct = m.meta_lucro > 0 ? Math.round((Number(m.realizado_lucro || 0) / Number(m.meta_lucro)) * 100) : 0;
          return (
            <Card key={m.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-warning" />
                    <div>
                      <p className="font-bold">{loja?.nome ?? '-'}</p>
                      <p className="text-xs text-muted-foreground">{meses[parseInt(filterMes)]} {filterAno} · #{idx + 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={fatPct >= 100 ? 'default' : 'destructive'}>{fatPct}%</Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(m)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {primaryRole === 'ADMIN' && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} title="Excluir" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-primary">Faturamento</span>
                      <span>{fmt(realizadoFat)} / {fmt(Number(m.meta_mensal))}</span>
                    </div>
                    <Progress value={Math.min(fatPct, 100)} className="h-2" />
                  </div>
                  {Number(m.meta_lucro) > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-warning">Lucro</span>
                        <span>{fmt(Number(m.realizado_lucro || 0))} / {fmt(Number(m.meta_lucro))}</span>
                      </div>
                      <Progress value={lucroPct} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma meta cadastrada para este período</p>
        )}
      </div>
    </div>
  );
}
