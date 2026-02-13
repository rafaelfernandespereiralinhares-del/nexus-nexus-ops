import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Wrench, UserCog, Download, Upload, Pencil, Trash2 } from 'lucide-react';
import { exportToCSV, exportToExcel, parseCSV, parseExcel } from '@/lib/csv';

interface Loja { id: string; nome: string; }
interface Funcionario {
  id: string; nome: string; cargo: string; loja_id: string; vinculo: string;
  salario: number; passagem: number; ajuda_custo: number; admissao: string; ativo: boolean;
}

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function Funcionarios() {
  const { profile, primaryRole } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [servicos, setServicos] = useState<Record<string, { total: number; comissao: number }>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [servicoDialogOpen, setServicoDialogOpen] = useState(false);
  const [selectedFunc, setSelectedFunc] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('ativos');
  const [filterLoja, setFilterLoja] = useState('todas');
  const [filterCargo, setFilterCargo] = useState('todos');
  const [form, setForm] = useState({
    nome: '', cargo: '', loja_id: '', vinculo: 'CLT', salario: '', passagem: '', ajuda_custo: '', admissao: new Date().toISOString().slice(0, 10)
  });
  const [servicoForm, setServicoForm] = useState({ descricao: '', valor: '', comissao: '' });

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    fetchFuncionarios();
  }, [profile]);

  const fetchFuncionarios = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('funcionarios').select('*').eq('empresa_id', profile.empresa_id).order('nome');
    if (data) {
      setFuncionarios(data as any);
      const { data: svcs } = await supabase.from('servicos_funcionario').select('funcionario_id, valor, comissao').eq('empresa_id', profile.empresa_id);
      if (svcs) {
        const agg: Record<string, { total: number; comissao: number }> = {};
        svcs.forEach((s: any) => {
          if (!agg[s.funcionario_id]) agg[s.funcionario_id] = { total: 0, comissao: 0 };
          agg[s.funcionario_id].total += Number(s.valor);
          agg[s.funcionario_id].comissao += Number(s.comissao);
        });
        setServicos(agg);
      }
    }
  };

  const resetForm = () => {
    setForm({ nome: '', cargo: '', loja_id: '', vinculo: 'CLT', salario: '', passagem: '', ajuda_custo: '', admissao: new Date().toISOString().slice(0, 10) });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id || !form.nome || !form.loja_id) {
      toast({ title: 'Preencha nome e loja', variant: 'destructive' }); return;
    }
    const payload = {
      empresa_id: profile.empresa_id,
      loja_id: form.loja_id,
      nome: form.nome,
      cargo: form.cargo,
      vinculo: form.vinculo as any,
      salario: parseFloat(form.salario) || 0,
      passagem: parseFloat(form.passagem) || 0,
      ajuda_custo: parseFloat(form.ajuda_custo) || 0,
      admissao: form.admissao,
    };
    let error;
    if (editId) {
      ({ error } = await supabase.from('funcionarios').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('funcionarios').insert(payload));
    }
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: editId ? 'Funcionário atualizado!' : 'Funcionário cadastrado!' });
      setDialogOpen(false);
      resetForm();
      fetchFuncionarios();
    }
  };

  const handleEdit = (f: Funcionario) => {
    setEditId(f.id);
    setForm({
      nome: f.nome, cargo: f.cargo, loja_id: f.loja_id, vinculo: f.vinculo,
      salario: String(f.salario), passagem: String(f.passagem), ajuda_custo: String(f.ajuda_custo),
      admissao: f.admissao,
    });
    setDialogOpen(true);
  };

  const handleToggleAtivo = async (f: Funcionario) => {
    await supabase.from('funcionarios').update({ ativo: !f.ativo }).eq('id', f.id);
    toast({ title: f.ativo ? 'Funcionário desativado' : 'Funcionário reativado' });
    fetchFuncionarios();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('funcionarios').delete().eq('id', id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Funcionário excluído!' }); fetchFuncionarios(); }
  };

  const handleSaveServico = async () => {
    if (!profile?.empresa_id || !selectedFunc) return;
    const { error } = await supabase.from('servicos_funcionario').insert({
      empresa_id: profile.empresa_id,
      funcionario_id: selectedFunc,
      descricao: servicoForm.descricao,
      valor: parseFloat(servicoForm.valor) || 0,
      comissao: parseFloat(servicoForm.comissao) || 0,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Serviço registrado!' });
      setServicoDialogOpen(false);
      setServicoForm({ descricao: '', valor: '', comissao: '' });
      setSelectedFunc(null);
      fetchFuncionarios();
    }
  };

  // Export
  const cols = [
    { key: 'nome', label: 'Nome' }, { key: 'cargo', label: 'Cargo' }, { key: 'loja', label: 'Loja' },
    { key: 'vinculo', label: 'Vínculo' }, { key: 'salario', label: 'Salário' }, { key: 'passagem', label: 'Passagem' },
    { key: 'ajuda_custo', label: 'Ajuda de Custo' }, { key: 'admissao', label: 'Admissão' },
  ];
  const exportData = () => funcionarios.map(f => ({
    nome: f.nome, cargo: f.cargo, loja: lojas.find(l => l.id === f.loja_id)?.nome ?? '-',
    vinculo: f.vinculo, salario: Number(f.salario).toFixed(2), passagem: Number(f.passagem).toFixed(2),
    ajuda_custo: Number(f.ajuda_custo).toFixed(2), admissao: new Date(f.admissao).toLocaleDateString('pt-BR'),
  }));

  const handleExportCSV = () => { exportToCSV(exportData(), 'funcionarios', cols); toast({ title: 'Exportado!' }); };
  const handleExportExcel = () => { exportToExcel(exportData(), 'funcionarios', cols); toast({ title: 'Exportado!' }); };

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
      const cargo = row['Cargo'] || row['cargo'] || '';
      const lojaNome = row['Loja'] || row['loja'];
      const vinculo = (row['Vínculo'] || row['vinculo'] || row['Vinculo'] || 'CLT').toUpperCase();
      const salario = parseFloat((row['Salário'] || row['salario'] || row['Salario'] || '0').replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.'));
      const passagem = parseFloat((row['Passagem'] || row['passagem'] || '0').replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.'));
      const ajuda = parseFloat((row['Ajuda de Custo'] || row['ajuda_custo'] || row['Ajuda'] || '0').replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.'));
      const loja = lojas.find(l => l.nome.toLowerCase().includes(lojaNome?.toLowerCase()) || lojaNome?.toLowerCase().includes(l.nome.toLowerCase()));
      if (!nome || !loja) continue;
      const { error } = await supabase.from('funcionarios').insert({
        empresa_id: profile.empresa_id, loja_id: loja.id, nome, cargo,
        vinculo: (['CLT', 'MEI', 'PJ', 'ESTAGIARIO'].includes(vinculo) ? vinculo : 'CLT') as any,
        salario, passagem, ajuda_custo: ajuda,
      });
      if (!error) imported++;
    }
    toast({ title: `${imported} funcionários importados de ${rows.length}` });
    if (fileRef.current) fileRef.current.value = '';
    fetchFuncionarios();
  };

  const cargos = [...new Set(funcionarios.map(f => f.cargo).filter(Boolean))];
  const filtered = funcionarios.filter(f => {
    if (filterStatus === 'ativos' && !f.ativo) return false;
    if (filterStatus === 'inativos' && f.ativo) return false;
    if (filterLoja !== 'todas' && f.loja_id !== filterLoja) return false;
    if (filterCargo !== 'todos' && f.cargo !== filterCargo) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Funcionários</h1>
          <p className="text-sm text-muted-foreground">Gestão de equipe e desempenho</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2" disabled={funcionarios.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2" disabled={funcionarios.length === 0}>
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
          <Dialog open={servicoDialogOpen} onOpenChange={setServicoDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Wrench className="h-4 w-4" /> Registrar Serviço</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Serviço</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Funcionário</Label>
                  <Select value={selectedFunc || ''} onValueChange={setSelectedFunc}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{funcionarios.filter(f => f.ativo).map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <Input value={servicoForm.descricao} onChange={e => setServicoForm(p => ({ ...p, descricao: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" value={servicoForm.valor} onChange={e => setServicoForm(p => ({ ...p, valor: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Comissão (R$)</Label>
                    <Input type="number" step="0.01" value={servicoForm.comissao} onChange={e => setServicoForm(p => ({ ...p, comissao: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleSaveServico} className="w-full">Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Funcionário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Funcionário</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Cargo</Label>
                    <Input value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vínculo</Label>
                    <Select value={form.vinculo} onValueChange={v => setForm(p => ({ ...p, vinculo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLT">CLT</SelectItem>
                        <SelectItem value="MEI">MEI</SelectItem>
                        <SelectItem value="PJ">PJ</SelectItem>
                        <SelectItem value="ESTAGIARIO">Estagiário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Loja</Label>
                  <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Salário (R$)</Label>
                    <Input type="number" step="0.01" value={form.salario} onChange={e => setForm(p => ({ ...p, salario: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Passagem (R$)</Label>
                    <Input type="number" step="0.01" value={form.passagem} onChange={e => setForm(p => ({ ...p, passagem: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ajuda de Custo</Label>
                    <Input type="number" step="0.01" value={form.ajuda_custo} onChange={e => setForm(p => ({ ...p, ajuda_custo: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Admissão</Label>
                  <Input type="date" value={form.admissao} onChange={e => setForm(p => ({ ...p, admissao: e.target.value }))} />
                </div>
                <Button onClick={handleSave} className="w-full">{editId ? 'Salvar' : 'Cadastrar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLoja} onValueChange={setFilterLoja}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as lojas</SelectItem>
              {lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCargo} onValueChange={setFilterCargo}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os cargos</SelectItem>
              {cargos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-sm font-medium">Funcionários {filterStatus === 'ativos' ? 'Ativos' : filterStatus === 'inativos' ? 'Inativos' : ''} ({filtered.length})</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead className="text-right">Serviços (R$)</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell>{f.cargo}</TableCell>
                  <TableCell>{lojas.find(l => l.id === f.loja_id)?.nome ?? '-'}</TableCell>
                  <TableCell>{new Date(f.admissao).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">{fmt(servicos[f.id]?.total || 0)}</TableCell>
                  <TableCell className="text-right text-success">{fmt(servicos[f.id]?.comissao || 0)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(f)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedFunc(f.id); setServicoDialogOpen(true); }} title="Registrar Serviço">
                        <UserCog className="h-4 w-4" />
                      </Button>
                      {primaryRole === 'ADMIN' && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)} title="Excluir" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum funcionário encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
