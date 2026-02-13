import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Home, Pencil } from 'lucide-react';
import { exportToExcel } from '@/lib/csv';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const CATEGORIAS = ['RETIRADA', 'ALUGUEL_CASA', 'ENERGIA', 'AGUA', 'INTERNET', 'ALIMENTACAO', 'SAUDE', 'EDUCACAO', 'TRANSPORTE', 'OUTROS'];
const CATEGORIA_LABELS: Record<string, string> = {
  RETIRADA: 'Retirada / Pró-Labore',
  ALUGUEL_CASA: 'Aluguel Casa',
  ENERGIA: 'Energia',
  AGUA: 'Água',
  INTERNET: 'Internet',
  ALIMENTACAO: 'Alimentação',
  SAUDE: 'Saúde',
  EDUCACAO: 'Educação',
  TRANSPORTE: 'Transporte',
  OUTROS: 'Outros',
};

export default function CustoCasa() {
  const { profile, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const { toast } = useToast();
  const [custos, setCustos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const hoje = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ descricao: '', valor: '', data: hoje, categoria: 'RETIRADA', status: 'ABERTO', observacao: '' });

  const [filterMes, setFilterMes] = useState(String(new Date().getMonth()));
  const [filterAno, setFilterAno] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    if (profile?.empresa_id) fetchCustos();
  }, [profile]);

  const fetchCustos = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('custos_casa').select('*')
      .eq('empresa_id', profile.empresa_id).order('data', { ascending: false });
    if (data) setCustos(data);
  };

  const mesStr = `${filterAno}-${String(parseInt(filterMes) + 1).padStart(2, '0')}`;
  const filtered = custos.filter(c => c.data?.startsWith(mesStr));

  const totalMes = filtered.reduce((s, c) => s + Number(c.valor), 0);
  const totalPago = filtered.filter(c => c.status === 'PAGO').reduce((s, c) => s + Number(c.valor), 0);
  const totalAberto = totalMes - totalPago;

  const resetForm = () => {
    setForm({ descricao: '', valor: '', data: hoje, categoria: 'RETIRADA', status: 'ABERTO', observacao: '' });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id || !form.descricao || !form.valor) {
      toast({ title: 'Preencha descrição e valor', variant: 'destructive' }); return;
    }
    const payload = {
      empresa_id: profile.empresa_id,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      data: form.data,
      categoria: form.categoria,
      status: form.status as any,
      observacao: form.observacao || null,
      data_pagamento: form.status === 'PAGO' ? form.data : null,
    };
    let error;
    if (editId) {
      ({ error } = await supabase.from('custos_casa').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('custos_casa').insert(payload));
    }
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: editId ? 'Atualizado!' : 'Custo registrado!' });
      setDialogOpen(false); resetForm(); fetchCustos();
    }
  };

  const handleEdit = (c: any) => {
    setEditId(c.id);
    setForm({ descricao: c.descricao, valor: String(c.valor), data: c.data, categoria: c.categoria, status: c.status, observacao: c.observacao || '' });
    setDialogOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('custos_casa').update({
      status: status as any,
      data_pagamento: status === 'PAGO' ? new Date().toISOString().slice(0, 10) : null,
    }).eq('id', id);
    fetchCustos();
  };

  const handleExport = () => {
    const data = filtered.map(c => ({
      data: new Date(c.data).toLocaleDateString('pt-BR'),
      categoria: CATEGORIA_LABELS[c.categoria] || c.categoria,
      descricao: c.descricao,
      valor: Number(c.valor).toFixed(2),
      status: c.status,
    }));
    exportToExcel(data, `custos_casa_${mesStr}`, [
      { key: 'data', label: 'Data' }, { key: 'categoria', label: 'Categoria' },
      { key: 'descricao', label: 'Descrição' }, { key: 'valor', label: 'Valor' },
      { key: 'status', label: 'Status' },
    ]);
  };

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Home className="h-6 w-6" /> Custo Casa / Retirada</h1>
          <p className="text-sm text-muted-foreground">Despesas pessoais e retiradas dos sócios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Custo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Editar Custo' : 'Novo Custo Casa'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={v => setForm(p => ({ ...p, categoria: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Ex: Retirada mensal" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Valor</Label>
                    <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data</Label>
                    <Input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ABERTO">Aberto</SelectItem>
                      <SelectItem value="PAGO">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Observação</Label>
                  <Input value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} placeholder="Opcional" />
                </div>
                <Button onClick={handleSave} className="w-full">{editId ? 'Salvar' : 'Registrar'}</Button>
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
          <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total do Mês</p>
          <p className="text-2xl font-bold">{fmt(totalMes)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Pago</p>
          <p className="text-2xl font-bold text-success">{fmt(totalPago)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Em Aberto</p>
          <p className="text-2xl font-bold text-destructive">{fmt(totalAberto)}</p>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{new Date(c.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{CATEGORIA_LABELS[c.categoria] || c.categoria}</TableCell>
                  <TableCell className="font-medium">{c.descricao}</TableCell>
                  <TableCell className="text-right">{fmt(Number(c.valor))}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'PAGO' ? 'default' : 'secondary'}>
                      {c.status === 'PAGO' ? 'Pago' : 'Aberto'}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    {c.status !== 'PAGO' && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, 'PAGO')}>Pagar</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum custo registrado neste mês</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
