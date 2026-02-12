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
import { Plus } from 'lucide-react';
import { validateOrError, contaReceberSchema } from '@/lib/validation';

interface Loja { id: string; nome: string; }

export default function ContasReceber() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ loja_id: '', cliente: '', valor: '', vencimento: '', status: 'ABERTO', etapa_cobranca: 'D1' });

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    fetchContas();
  }, [profile]);

  const fetchContas = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('contas_receber').select('*').eq('empresa_id', profile.empresa_id).order('vencimento', { ascending: true });
    if (data) setContas(data);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id) return;
    const v = validateOrError(contaReceberSchema, { loja_id: form.loja_id, cliente: form.cliente, valor: parseFloat(form.valor), vencimento: form.vencimento });
    if (v) { toast({ title: 'Validação', description: v, variant: 'destructive' }); return; }
    const { error } = await supabase.from('contas_receber').insert({
      empresa_id: profile.empresa_id,
      loja_id: form.loja_id,
      cliente: form.cliente,
      valor: parseFloat(form.valor),
      vencimento: form.vencimento,
      status: form.status as any,
      etapa_cobranca: form.etapa_cobranca as any,
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Conta registrada!' });
      setDialogOpen(false);
      setForm({ loja_id: '', cliente: '', valor: '', vencimento: '', status: 'ABERTO', etapa_cobranca: 'D1' });
      fetchContas();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('contas_receber').update({
      status: status as any,
      data_pagamento: status === 'PAGO' ? new Date().toISOString().slice(0, 10) : null,
    }).eq('id', id);
    fetchContas();
  };

  const statusBadge = (s: string) => {
    if (s === 'PAGO') return <Badge className="bg-success text-success-foreground">Pago</Badge>;
    if (s === 'ATRASADO') return <Badge className="bg-danger text-danger-foreground">Atrasado</Badge>;
    if (s === 'NEGOCIADO') return <Badge className="bg-warning text-warning-foreground">Negociado</Badge>;
    return <Badge variant="secondary">Aberto</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Contas a Receber</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Conta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Conta a Receber</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Loja</Label>
                <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Input value={form.cliente} onChange={e => setForm(p => ({ ...p, cliente: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Vencimento</Label>
                  <Input type="date" value={form.vencimento} onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Etapa de Cobrança</Label>
                <Select value={form.etapa_cobranca} onValueChange={v => setForm(p => ({ ...p, etapa_cobranca: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['D1','D7','D15','D30','JURIDICO'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.cliente}</TableCell>
                  <TableCell>{lojas.find(l => l.id === c.loja_id)?.nome ?? '-'}</TableCell>
                  <TableCell className="text-right">R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{new Date(c.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><Badge variant="outline">{c.etapa_cobranca}</Badge></TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell>
                    {c.status !== 'PAGO' && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, 'PAGO')}>Marcar Pago</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {contas.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma conta registrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
