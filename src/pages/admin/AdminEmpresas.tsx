import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download } from 'lucide-react';
import { validateOrError, empresaSchema } from '@/lib/validation';
import { exportToCSV, exportToExcel } from '@/lib/csv';

export default function AdminEmpresas() {
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', plano_id: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [e, p] = await Promise.all([
      supabase.from('empresas').select('*').order('created_at', { ascending: false }),
      supabase.from('planos').select('*'),
    ]);
    if (e.data) setEmpresas(e.data);
    if (p.data) setPlanos(p.data);
  };

  const handleSave = async () => {
    const v = validateOrError(empresaSchema, { nome: form.nome });
    if (v) { toast({ title: 'Validação', description: v, variant: 'destructive' }); return; }
    const { error } = await supabase.from('empresas').insert({
      nome: form.nome,
      plano_id: form.plano_id || null,
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Empresa criada!' });
      setDialogOpen(false);
      setForm({ nome: '', plano_id: '' });
      fetchAll();
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from('empresas').update({ ativo: !ativo }).eq('id', id);
    fetchAll();
  };

  const handleExport = () => {
    const data = empresas.map(e => ({
      nome: e.nome,
      plano: planos.find(p => p.id === e.plano_id)?.nome ?? '-',
      status: e.ativo ? 'Ativa' : 'Inativa',
      criada_em: new Date(e.created_at).toLocaleDateString('pt-BR'),
    }));
    const cols = [
      { key: 'nome', label: 'Nome' },
      { key: 'plano', label: 'Plano' },
      { key: 'status', label: 'Status' },
      { key: 'criada_em', label: 'Criada em' },
    ];
    exportToCSV(data, 'empresas', cols);
    toast({ title: 'Exportado!' });
  };

  const handleExportExcel = () => {
    const data = empresas.map(e => ({
      nome: e.nome,
      plano: planos.find(p => p.id === e.plano_id)?.nome ?? '-',
      status: e.ativo ? 'Ativa' : 'Inativa',
      criada_em: new Date(e.created_at).toLocaleDateString('pt-BR'),
    }));
    const cols = [
      { key: 'nome', label: 'Nome' },
      { key: 'plano', label: 'Plano' },
      { key: 'status', label: 'Status' },
      { key: 'criada_em', label: 'Criada em' },
    ];
    exportToExcel(data, 'empresas', cols);
    toast({ title: 'Exportado!' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Empresas</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={empresas.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2" disabled={empresas.length === 0}>
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Empresa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Plano</Label>
                  <Select value={form.plano_id} onValueChange={v => setForm(p => ({ ...p, plano_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{planos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} className="w-full">Criar Empresa</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nome}</TableCell>
                  <TableCell>{planos.find(p => p.id === e.plano_id)?.nome ?? '-'}</TableCell>
                  <TableCell>
                    <Badge className={e.ativo ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                      {e.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(e.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleAtivo(e.id, e.ativo)}>
                      {e.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
