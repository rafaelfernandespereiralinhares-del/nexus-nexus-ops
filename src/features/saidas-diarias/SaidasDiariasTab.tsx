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

export interface SaidaDiaria {
  id: string;
  empresa_id: string;
  loja_id: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  observacao: string | null;
}

const CATEGORIAS = ['PEÇAS MANUTENÇÃO', 'SUPERMERCADO', 'COMBUSTÍVEL', 'MATERIAL', 'ALIMENTAÇÃO', 'TRANSPORTE', 'OUTROS'];

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

interface Props {
  lojaId: string;
  empresaId: string;
  data: string;
  saldoCaixaDia: number; // dinheiro entradas - sangrias + saldo_inicial + suprimentos
  onTotalChange?: (total: number) => void;
  readonly?: boolean;
}

export default function SaidasDiariasTab({ lojaId, empresaId, data, saldoCaixaDia, onTotalChange, readonly }: Props) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [items, setItems] = useState<SaidaDiaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const blank = { descricao: '', categoria: 'PEÇAS MANUTENÇÃO', valor: '', observacao: '' };
  const [form, setForm] = useState(blank);

  const total = items.reduce((s, i) => s + Number(i.valor), 0);
  const sobrando = saldoCaixaDia - total;

  useEffect(() => {
    if (!lojaId || !data) return;
    fetchItems();
  }, [lojaId, data]);

  useEffect(() => { onTotalChange?.(total); }, [total]);

  const fetchItems = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('saidas_diarias').select('*')
      .eq('loja_id', lojaId).eq('data', data)
      .order('created_at', { ascending: false });
    setItems((rows ?? []) as SaidaDiaria[]);
    setLoading(false);
  };

  const resetForm = () => { setForm(blank); setEditingId(null); };

  const handleSave = async () => {
    if (!form.descricao.trim() || !form.valor) {
      toast({ title: 'Preencha descrição e valor', variant: 'destructive' });
      return;
    }
    const payload = {
      empresa_id: empresaId,
      loja_id: lojaId,
      data,
      descricao: form.descricao.trim(),
      categoria: form.categoria,
      valor: parseFloat(form.valor) || 0,
      observacao: form.observacao || null,
      created_by: profile?.user_id ?? null,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from('saidas_diarias').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('saidas_diarias').insert(payload));
    }
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Saída atualizada!' : 'Saída adicionada!' });
      resetForm();
      fetchItems();
    }
  };

  const handleEdit = (item: SaidaDiaria) => {
    setEditingId(item.id);
    setForm({
      descricao: item.descricao,
      categoria: item.categoria,
      valor: String(item.valor),
      observacao: item.observacao ?? '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta saída?')) return;
    const { error } = await supabase.from('saidas_diarias').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Saída excluída!' }); fetchItems(); }
  };

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="bg-muted/50"><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Caixa do dia</p>
          <p className="text-lg font-bold">{fmt(saldoCaixaDia)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{new Date(data + 'T00:00').toLocaleDateString('pt-BR')}</p>
        </CardContent></Card>
        <Card className="bg-destructive/10 border-destructive/30"><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Total Saídas</p>
          <p className="text-lg font-bold text-destructive">- {fmt(total)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{items.length} lançamento(s)</p>
        </CardContent></Card>
        <Card className={sobrando >= 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Sobrando no fim do dia</p>
            <p className={`text-lg font-bold ${sobrando >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(sobrando)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">caixa − saídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {!readonly && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="grid gap-3 md:grid-cols-12">
              <div className="md:col-span-4 space-y-1">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="ex: Tela iPhone 11" />
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(p => ({ ...p, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" />
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label>Observação</Label>
                <Input value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} placeholder="opcional" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2">
                {editingId ? <><Save className="h-4 w-4" /> Salvar Alteração</> : <><Plus className="h-4 w-4" /> Adicionar Saída</>}
              </Button>
              {editingId && <Button variant="outline" onClick={resetForm} className="gap-2"><X className="h-4 w-4" />Cancelar</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma saída registrada hoje.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Obs</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {!readonly && <TableHead className="text-center w-24">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(it => (
                  <TableRow key={it.id}>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded bg-muted">{it.categoria}</span></TableCell>
                    <TableCell className="font-medium">{it.descricao}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{it.observacao}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">{fmt(Number(it.valor))}</TableCell>
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
                  <TableCell colSpan={3}>TOTAL DO DIA</TableCell>
                  <TableCell className="text-right text-destructive">{fmt(total)}</TableCell>
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
