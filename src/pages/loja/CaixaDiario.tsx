import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Lock, Pencil, Trash2 } from 'lucide-react';

interface Loja { id: string; nome: string; }
interface Fechamento {
  id: string; data: string; loja_id: string; saldo_inicial: number; dinheiro: number;
  pix: number; cartao: number; sangrias: number; suprimentos: number; saidas: number;
  total_entradas: number | null; saldo_final: number | null; status: string;
  responsavel_nome_snapshot: string | null;
}

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const blankForm = () => ({
  loja_id: '', data: new Date().toISOString().slice(0, 10),
  saldo_inicial: '', dinheiro: '', pix: '', cartao: '',
  sangrias: '', suprimentos: '', saidas: '', valor_caixa_declarado: '',
});

export default function CaixaDiario() {
  const { profile, primaryRole, hasRole } = useAuth();
  const { toast } = useToast();
  const hoje = new Date().toISOString().slice(0, 10);
  const isLoja = primaryRole === 'LOJA';
  const isAdmin = hasRole('ADMIN');
  const canEditDelete = isAdmin || hasRole('FINANCEIRO');

  // Loja-specific state
  const [form, setForm] = useState({
    saldo_inicial: '', dinheiro: '', pix: '', cartao: '',
    sangrias: '', suprimentos: '', saidas: '', valor_caixa_declarado: ''
  });
  const [fechamentoId, setFechamentoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('ABERTO');
  const [saving, setSaving] = useState(false);

  // Multi-store listing state
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [filterLoja, setFilterLoja] = useState('todas');

  // New entry dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState(blankForm());

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(blankForm());

  // Delete confirm
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const n = (v: string) => parseFloat(v) || 0;

  useEffect(() => {
    if (!profile?.empresa_id) return;
    if (isLoja && profile.loja_id) {
      supabase.from('fechamentos').select('*')
        .eq('loja_id', profile.loja_id).eq('data', hoje).is('deleted_at', null).single()
        .then(({ data }) => {
          if (data) {
            setFechamentoId(data.id);
            setStatus(data.status as string);
            setForm({
              saldo_inicial: String(data.saldo_inicial ?? ''), dinheiro: String(data.dinheiro ?? ''),
              pix: String(data.pix ?? ''), cartao: String(data.cartao ?? ''),
              sangrias: String(data.sangrias ?? ''), suprimentos: String(data.suprimentos ?? ''),
              saidas: String(data.saidas ?? ''), valor_caixa_declarado: String(data.valor_caixa_declarado ?? ''),
            });
          }
        });
    } else {
      supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
        .then(({ data }) => { if (data) setLojas(data); });
      fetchFechamentos();
    }
  }, [profile]);

  const fetchFechamentos = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('fechamentos').select('*')
      .eq('empresa_id', profile.empresa_id).is('deleted_at', null)
      .order('data', { ascending: false }).limit(100);
    if (data) setFechamentos(data as any);
  };

  // LOJA save/close
  const totalEntradas = n(form.dinheiro) + n(form.pix) + n(form.cartao);
  const saldoFinal = n(form.saldo_inicial) + totalEntradas + n(form.suprimentos) - n(form.sangrias) - n(form.saidas);
  const isLocked = status !== 'ABERTO' && status !== 'REABERTO';

  const handleSave = async (fechar = false) => {
    if (!profile?.loja_id || !profile?.empresa_id) return;
    setSaving(true);
    const payload = {
      empresa_id: profile.empresa_id, loja_id: profile.loja_id, data: hoje,
      saldo_inicial: n(form.saldo_inicial), dinheiro: n(form.dinheiro), pix: n(form.pix), cartao: n(form.cartao),
      sangrias: n(form.sangrias), suprimentos: n(form.suprimentos), saidas: n(form.saidas),
      valor_caixa_declarado: n(form.valor_caixa_declarado) || null,
      status: fechar ? 'FECHADO_PENDENTE_CONCILIACAO' as const : 'ABERTO' as const,
      responsavel_usuario_id: profile.user_id, responsavel_nome_snapshot: profile.nome,
    };
    let error;
    if (fechamentoId) {
      ({ error } = await supabase.from('fechamentos').update(payload).eq('id', fechamentoId));
    } else {
      const res = await supabase.from('fechamentos').insert(payload).select('id').single();
      error = res.error;
      if (res.data) setFechamentoId(res.data.id);
    }
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      if (fechar) setStatus('FECHADO_PENDENTE_CONCILIACAO');
      toast({ title: fechar ? 'Caixa fechado!' : 'Salvo com sucesso!' });
    }
    setSaving(false);
  };

  // New entry
  const handleNewEntry = async () => {
    if (!profile?.empresa_id || !newForm.loja_id) { toast({ title: 'Selecione a loja', variant: 'destructive' }); return; }
    const { error } = await supabase.from('fechamentos').insert({
      empresa_id: profile.empresa_id, loja_id: newForm.loja_id, data: newForm.data,
      saldo_inicial: n(newForm.saldo_inicial), dinheiro: n(newForm.dinheiro), pix: n(newForm.pix), cartao: n(newForm.cartao),
      sangrias: n(newForm.sangrias), suprimentos: n(newForm.suprimentos), saidas: n(newForm.saidas),
      valor_caixa_declarado: n(newForm.valor_caixa_declarado) || null,
      responsavel_usuario_id: profile.user_id, responsavel_nome_snapshot: profile.nome,
    });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Lançamento criado!' });
      setDialogOpen(false);
      setNewForm(blankForm());
      fetchFechamentos();
    }
  };

  // Open edit dialog
  const openEdit = (f: Fechamento) => {
    setEditingId(f.id);
    setEditForm({
      loja_id: f.loja_id,
      data: f.data,
      saldo_inicial: String(f.saldo_inicial ?? ''),
      dinheiro: String(f.dinheiro ?? ''),
      pix: String(f.pix ?? ''),
      cartao: String(f.cartao ?? ''),
      sangrias: String(f.sangrias ?? ''),
      suprimentos: String(f.suprimentos ?? ''),
      saidas: String(f.saidas ?? ''),
      valor_caixa_declarado: '',
    });
    setEditDialogOpen(true);
  };

  // Save edit
  const handleEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('fechamentos').update({
      loja_id: editForm.loja_id,
      data: editForm.data,
      saldo_inicial: n(editForm.saldo_inicial),
      dinheiro: n(editForm.dinheiro),
      pix: n(editForm.pix),
      cartao: n(editForm.cartao),
      sangrias: n(editForm.sangrias),
      suprimentos: n(editForm.suprimentos),
      saidas: n(editForm.saidas),
    }).eq('id', editingId);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Lançamento atualizado!' });
      setEditDialogOpen(false);
      setEditingId(null);
      fetchFechamentos();
    }
  };

  // Delete (soft-delete)
  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const { error } = await supabase.from('fechamentos')
      .update({ deleted_at: new Date().toISOString() } as any).eq('id', deletingId);
    if (error) toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Lançamento excluído!' });
      fetchFechamentos();
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const formFields = [
    { key: 'saldo_inicial', label: 'Saldo Inicial' },
    { key: 'dinheiro', label: 'Dinheiro' },
    { key: 'pix', label: 'PIX' },
    { key: 'cartao', label: 'Cartão' },
    { key: 'sangrias', label: 'Sangrias' },
    { key: 'suprimentos', label: 'Suprimentos' },
    { key: 'saidas', label: 'Saídas' },
  ];

  // LOJA view
  if (isLoja) {
    const fields = [
      { key: 'saldo_inicial', label: 'Saldo Inicial' }, { key: 'dinheiro', label: 'Dinheiro' },
      { key: 'pix', label: 'PIX' }, { key: 'cartao', label: 'Cartão' },
      { key: 'sangrias', label: 'Sangrias' }, { key: 'suprimentos', label: 'Suprimentos' },
      { key: 'saidas', label: 'Saídas' }, { key: 'valor_caixa_declarado', label: 'Valor Declarado no Caixa' },
    ];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Caixa Diário</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Lançamento do Dia {isLocked && <Lock className="h-4 w-4 text-warning" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input id={f.key} type="number" step="0.01"
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    disabled={isLocked} placeholder="0,00" />
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card className="bg-muted/50"><CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-xl font-bold text-foreground">{fmt(totalEntradas)}</p>
              </CardContent></Card>
              <Card className="bg-muted/50"><CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Saldo Final</p>
                <p className="text-xl font-bold text-foreground">{fmt(saldoFinal)}</p>
              </CardContent></Card>
            </div>
            {!isLocked && (
              <div className="mt-6 flex gap-3">
                <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
                <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2"><Lock className="h-4 w-4" /> Fechar Caixa</Button>
              </div>
            )}
            {isLocked && <p className="mt-4 text-sm text-warning">Caixa fechado. Somente o financeiro pode reabrir.</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ADMIN/FINANCEIRO/DIRETORIA listing view
  const filteredFechamentos = filterLoja === 'todas' ? fechamentos : fechamentos.filter(f => f.loja_id === filterLoja);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Caixa Diário</h1>
          <p className="text-sm text-muted-foreground">Controle de caixa por loja</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Lançamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Loja</Label>
                  <Select value={newForm.loja_id} onValueChange={v => setNewForm(p => ({ ...p, loja_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input type="date" value={newForm.data} onChange={e => setNewForm(p => ({ ...p, data: e.target.value }))} />
                </div>
              </div>
              {formFields.map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Input type="number" step="0.01" value={newForm[f.key as keyof typeof newForm]}
                    onChange={e => setNewForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder="0,00" />
                </div>
              ))}
              <Button onClick={handleNewEntry} className="w-full">Criar Lançamento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Select value={filterLoja} onValueChange={setFilterLoja}>
        <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as lojas</SelectItem>
          {lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead className="text-right">Dinheiro</TableHead>
                <TableHead className="text-right">Pix</TableHead>
                <TableHead className="text-right">Cartão</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right text-primary font-bold">Total</TableHead>
                <TableHead>Status</TableHead>
                {canEditDelete && <TableHead className="text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFechamentos.map(f => {
                const te = Number(f.dinheiro) + Number(f.pix) + Number(f.cartao);
                return (
                  <TableRow key={f.id}>
                    <TableCell>{new Date(f.data + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{lojas.find(l => l.id === f.loja_id)?.nome ?? '-'}</TableCell>
                    <TableCell className="text-right">{fmt(Number(f.dinheiro))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(f.pix))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(f.cartao))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(f.saidas))}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{fmt(te)}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Select value={f.status} onValueChange={async (v) => {
                          await supabase.from('fechamentos').update({ status: v as any }).eq('id', f.id);
                          fetchFechamentos();
                        }}>
                          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ABERTO">Aberto</SelectItem>
                            <SelectItem value="FECHADO_PENDENTE_CONCILIACAO">Fechado</SelectItem>
                            <SelectItem value="CONCILIADO_OK">Conciliado OK</SelectItem>
                            <SelectItem value="CONCILIADO_DIVERGENCIA">Divergência</SelectItem>
                            <SelectItem value="REABERTO">Reaberto</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={f.status === 'ABERTO' ? 'secondary' : 'default'}>
                          {f.status === 'ABERTO' ? 'Aberto' : f.status === 'FECHADO_PENDENTE_CONCILIACAO' ? 'Fechado' : f.status}
                        </Badge>
                      )}
                    </TableCell>
                    {canEditDelete && (
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(f)} title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => openDelete(f.id)} title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filteredFechamentos.length === 0 && (
                <TableRow><TableCell colSpan={canEditDelete ? 9 : 8} className="text-center text-muted-foreground py-8">Nenhum lançamento encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Lançamento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Loja</Label>
                <Select value={editForm.loja_id} onValueChange={v => setEditForm(p => ({ ...p, loja_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={editForm.data} onChange={e => setEditForm(p => ({ ...p, data: e.target.value }))} />
              </div>
            </div>
            {formFields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input type="number" step="0.01" value={editForm[f.key as keyof typeof editForm]}
                  onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder="0,00" />
              </div>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleEdit}><Save className="h-4 w-4 mr-2" />Salvar Alterações</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lançamento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
