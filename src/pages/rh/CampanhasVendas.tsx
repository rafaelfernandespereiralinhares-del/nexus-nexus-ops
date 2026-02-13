import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Wrench, Trophy, Download, Upload, Pencil, Trash2 } from 'lucide-react';
import { exportToCSV, exportToExcel, parseCSV, parseExcel } from '@/lib/csv';

interface Campanha {
  id: string; nome: string; produto_servico: string; tipo: string;
  meta_quantidade: number; progresso: number; data_inicio: string; data_fim: string; ativa: boolean;
}

export default function CampanhasVendas() {
  const { profile, primaryRole } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tab, setTab] = useState('todas');
  const [form, setForm] = useState({
    nome: '', produto_servico: '', tipo: 'MENSAL',
    meta_quantidade: '', data_inicio: new Date().toISOString().slice(0, 10),
    data_fim: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!profile?.empresa_id) return;
    fetchCampanhas();
  }, [profile]);

  const fetchCampanhas = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('campanhas').select('*').eq('empresa_id', profile.empresa_id).order('created_at', { ascending: false });
    if (data) setCampanhas(data as any);
  };

  const resetForm = () => {
    setForm({ nome: '', produto_servico: '', tipo: 'MENSAL', meta_quantidade: '', data_inicio: new Date().toISOString().slice(0, 10), data_fim: new Date().toISOString().slice(0, 10) });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id || !form.nome) {
      toast({ title: 'Preencha o nome', variant: 'destructive' }); return;
    }
    const payload = {
      empresa_id: profile.empresa_id,
      nome: form.nome,
      produto_servico: form.produto_servico,
      tipo: form.tipo as any,
      meta_quantidade: parseInt(form.meta_quantidade) || 0,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
    };
    let error;
    if (editId) {
      ({ error } = await supabase.from('campanhas').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('campanhas').insert(payload));
    }
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: editId ? 'Campanha atualizada!' : 'Campanha criada!' });
      setDialogOpen(false);
      resetForm();
      fetchCampanhas();
    }
  };

  const handleEdit = (c: Campanha) => {
    setEditId(c.id);
    setForm({
      nome: c.nome, produto_servico: c.produto_servico, tipo: c.tipo,
      meta_quantidade: String(c.meta_quantidade), data_inicio: c.data_inicio, data_fim: c.data_fim,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('campanhas').delete().eq('id', id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Campanha excluída!' }); fetchCampanhas(); }
  };

  // Export
  const cols = [
    { key: 'nome', label: 'Nome' }, { key: 'produto_servico', label: 'Produto/Serviço' },
    { key: 'tipo', label: 'Tipo' }, { key: 'meta_quantidade', label: 'Meta (Qtd)' },
    { key: 'progresso', label: 'Progresso' }, { key: 'data_inicio', label: 'Início' }, { key: 'data_fim', label: 'Fim' },
  ];
  const expData = () => campanhas.map(c => ({
    nome: c.nome, produto_servico: c.produto_servico, tipo: c.tipo,
    meta_quantidade: String(c.meta_quantidade), progresso: String(c.progresso),
    data_inicio: new Date(c.data_inicio).toLocaleDateString('pt-BR'),
    data_fim: new Date(c.data_fim).toLocaleDateString('pt-BR'),
  }));
  const handleExportCSV = () => { exportToCSV(expData(), 'campanhas', cols); toast({ title: 'Exportado!' }); };
  const handleExportExcel = () => { exportToExcel(expData(), 'campanhas', cols); toast({ title: 'Exportado!' }); };

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
    if (rows.length === 0) { toast({ title: 'Arquivo vazio', variant: 'destructive' }); return; }
    let imported = 0;
    for (const row of rows) {
      const nome = row['Nome'] || row['nome'];
      const produto = row['Produto/Serviço'] || row['produto_servico'] || row['Produto'] || '';
      const tipo = (row['Tipo'] || row['tipo'] || 'MENSAL').toUpperCase();
      const meta = parseInt(row['Meta (Qtd)'] || row['meta_quantidade'] || row['Meta'] || '0');
      if (!nome) continue;
      const { error } = await supabase.from('campanhas').insert({
        empresa_id: profile.empresa_id, nome, produto_servico: produto,
        tipo: (['DIARIA', 'SEMANAL', 'MENSAL'].includes(tipo) ? tipo : 'MENSAL') as any,
        meta_quantidade: meta,
      });
      if (!error) imported++;
    }
    toast({ title: `${imported} campanhas importadas de ${rows.length}` });
    if (fileRef.current) fileRef.current.value = '';
    fetchCampanhas();
  };

  const filtered = campanhas.filter(c => {
    if (tab === 'todas') return true;
    if (tab === 'diarias') return c.tipo === 'DIARIA';
    if (tab === 'semanais') return c.tipo === 'SEMANAL';
    if (tab === 'mensais') return c.tipo === 'MENSAL';
    return true;
  });

  const tipoBadge = (t: string) => {
    if (t === 'DIARIA') return <Badge variant="outline">Diária</Badge>;
    if (t === 'SEMANAL') return <Badge variant="outline">Semanal</Badge>;
    return <Badge variant="outline">Mensal</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Campanhas de Vendas</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento de campanhas por produto e serviço</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2" disabled={campanhas.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2" disabled={campanhas.length === 0}>
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Campanha</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Nova'} Campanha</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Produto/Serviço</Label>
                  <Input value={form.produto_servico} onChange={e => setForm(p => ({ ...p, produto_servico: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIARIA">Diária</SelectItem>
                        <SelectItem value="SEMANAL">Semanal</SelectItem>
                        <SelectItem value="MENSAL">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Início</Label>
                    <Input type="date" value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fim</Label>
                    <Input type="date" value={form.data_fim} onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Meta (unidades)</Label>
                  <Input type="number" value={form.meta_quantidade} onChange={e => setForm(p => ({ ...p, meta_quantidade: e.target.value }))} />
                </div>
                <Button onClick={handleSave} className="w-full">{editId ? 'Salvar' : 'Criar Campanha'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Auto campaign banner */}
      <Card className="border-primary/30">
        <CardContent className="flex items-start gap-3 pt-6">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <Trophy className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="font-medium">Campanha Automática — Manutenção de Celular</p>
            <p className="text-sm text-muted-foreground">Top 3 funcionários com mais serviços de manutenção no mês. Comissão gerada automaticamente.</p>
            <p className="mt-2 text-sm text-primary">Nenhum serviço de manutenção registrado ainda.</p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="diarias">Diárias</TabsTrigger>
          <TabsTrigger value="semanais">Semanais</TabsTrigger>
          <TabsTrigger value="mensais">Mensais</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-4">
          {filtered.map(c => {
            const pct = c.meta_quantidade > 0 ? Math.round((c.progresso / c.meta_quantidade) * 100) : 0;
            return (
              <Card key={c.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.produto_servico} · {new Date(c.data_inicio).toLocaleDateString('pt-BR')} a {new Date(c.data_fim).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tipoBadge(c.tipo)}
                      <Badge variant={pct >= 100 ? 'default' : 'destructive'} className="text-xs">{pct}%</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {primaryRole === 'ADMIN' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} title="Excluir" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso</span>
                      <span>{c.progresso} / {c.meta_quantidade} unidades</span>
                    </div>
                    <Progress value={pct} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma campanha encontrada</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
