import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

interface Vale {
  id: string;
  empresa_id: string;
  loja_id: string;
  funcionario_id: string | null;
  funcionario_nome: string;
  data: string;
  valor: number;
  descricao: string | null;
}

interface Funcionario { id: string; nome: string; }

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

interface Props {
  lojaId: string;
  empresaId: string;
  mes: string; // YYYY-MM
  onTotalChange?: (total: number) => void;
  readonly?: boolean;
}

export default function ValesFuncionariosTab({ lojaId, empresaId, mes, onTotalChange, readonly }: Props) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [items, setItems] = useState<Vale[]>([]);
  const [funcs, setFuncs] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const blank = {
    funcionario_id: '',
    funcionario_nome: '',
    data: new Date().toISOString().slice(0, 10),
    valor: '',
    descricao: '',
  };
  const [form, setForm] = useState(blank);

  const total = items.reduce((s, i) => s + Number(i.valor), 0);

  useEffect(() => {
    if (!lojaId || !mes) return;
    fetchAll();
  }, [lojaId, mes]);

  useEffect(() => { onTotalChange?.(total); }, [total]);

  const fetchAll = async () => {
    setLoading(true);
    const start = `${mes}-01`;
    const [y, m] = mes.split('-').map(Number);
    const endDate = new Date(y, m, 1);
    const end = endDate.toISOString().slice(0, 10);
    const [{ data: rows }, { data: funcRows }] = await Promise.all([
      supabase.from('vales_funcionarios').select('*')
        .eq('loja_id', lojaId).gte('data', start).lt('data', end)
        .order('data', { ascending: false }),
      supabase.from('funcionarios').select('id, nome')
        .eq('loja_id', lojaId).eq('ativo', true).order('nome'),
    ]);
    setItems((rows ?? []) as Vale[]);
    setFuncs((funcRows ?? []) as Funcionario[]);
    setLoading(false);
  };

  const resetForm = () => { setForm(blank); setEditingId(null); };

  const handleSave = async () => {
    if (!form.funcionario_nome.trim() || !form.valor) {
      toast({ title: 'Preencha funcionário e valor', variant: 'destructive' });
      return;
    }
    const payload = {
      empresa_id: empresaId,
      loja_id: lojaId,
      funcionario_id: form.funcionario_id || null,
      funcionario_nome: form.funcionario_nome.trim(),
      data: form.data,
      valor: parseFloat(form.valor) || 0,
      descricao: form.descricao || null,
      created_by: profile?.user_id ?? null,
    };
    const { error } = editingId
      ? await supabase.from('vales_funcionarios').update(payload).eq('id', editingId)
      : await supabase.from('vales_funcionarios').insert(payload);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      toast({ title: editingId ? 'Vale atualizado!' : 'Vale adicionado!' });
      resetForm(); fetchAll();
    }
  };

  const handleEdit = (v: Vale) => {
    setEditingId(v.id);
    setForm({
      funcionario_id: v.funcionario_id ?? '',
      funcionario_nome: v.funcionario_nome,
      data: v.data,
      valor: String(v.valor),
      descricao: v.descricao ?? '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este vale?')) return;
    const { error } = await supabase.from('vales_funcionarios').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Vale excluído!' }); fetchAll(); }
  };

  const onSelectFunc = (id: string) => {
    const f = funcs.find(x => x.id === id);
    setForm(p => ({ ...p, funcionario_id: id, funcionario_nome: f?.nome ?? p.funcionario_nome }));
  };

  return (
    <div className="space-y-4">
      <Card className="bg-warning/10 border-warning/30">
        <CardContent className="py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total de Vales no mês</p>
            <p className="text-lg font-bold text-warning">{fmt(total)}</p>
          </div>
          <p className="text-xs text-muted-foreground">{items.length} lançamento(s)</p>
        </CardContent>
      </Card>

      {!readonly && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid gap-3 md:grid-cols-12">
              <div className="md:col-span-3 space-y-1">
                <Label>Funcionário</Label>
                {funcs.length > 0 ? (
                  <Select value={form.funcionario_id} onValueChange={onSelectFunc}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {funcs.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.funcionario_nome} onChange={e => setForm(p => ({ ...p, funcionario_nome: e.target.value }))} placeholder="Nome" />
                )}
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" />
              </div>
              <div className="md:col-span-5 space-y-1">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="opcional" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2">
                {editingId ? <><Save className="h-4 w-4" /> Salvar Alteração</> : <><Plus className="h-4 w-4" /> Adicionar Vale</>}
              </Button>
              {editingId && <Button variant="outline" onClick={resetForm} className="gap-2"><X className="h-4 w-4" />Cancelar</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum vale no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {!readonly && <TableHead className="text-center w-24">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(it => (
                  <TableRow key={it.id}>
                    <TableCell>{new Date(it.data + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{it.funcionario_nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{it.descricao}</TableCell>
                    <TableCell className="text-right font-bold text-warning">{fmt(Number(it.valor))}</TableCell>
                    {!readonly && (
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(it)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell colSpan={3}>TOTAL DO MÊS</TableCell>
                  <TableCell className="text-right text-warning">{fmt(total)}</TableCell>
                  {!readonly && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
