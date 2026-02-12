import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Lock } from 'lucide-react';

export default function CaixaDiario() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const hoje = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    saldo_inicial: '', dinheiro: '', pix: '', cartao: '',
    sangrias: '', suprimentos: '', saidas: '', valor_caixa_declarado: ''
  });
  const [fechamentoId, setFechamentoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('ABERTO');
  const [saving, setSaving] = useState(false);

  const n = (v: string) => parseFloat(v) || 0;
  const totalEntradas = n(form.dinheiro) + n(form.pix) + n(form.cartao);
  const saldoFinal = n(form.saldo_inicial) + totalEntradas + n(form.suprimentos) - n(form.sangrias) - n(form.saidas);

  useEffect(() => {
    if (!profile?.loja_id) return;
    supabase.from('fechamentos')
      .select('*')
      .eq('loja_id', profile.loja_id)
      .eq('data', hoje)
      .is('deleted_at', null)
      .single()
      .then(({ data }) => {
        if (data) {
          setFechamentoId(data.id);
          setStatus(data.status as string);
          setForm({
            saldo_inicial: String(data.saldo_inicial ?? ''),
            dinheiro: String(data.dinheiro ?? ''),
            pix: String(data.pix ?? ''),
            cartao: String(data.cartao ?? ''),
            sangrias: String(data.sangrias ?? ''),
            suprimentos: String(data.suprimentos ?? ''),
            saidas: String(data.saidas ?? ''),
            valor_caixa_declarado: String(data.valor_caixa_declarado ?? ''),
          });
        }
      });
  }, [profile]);

  const isLocked = status !== 'ABERTO' && status !== 'REABERTO';

  const handleSave = async (fechar = false) => {
    if (!profile?.loja_id || !profile?.empresa_id) return;
    setSaving(true);

    const payload = {
      empresa_id: profile.empresa_id,
      loja_id: profile.loja_id,
      data: hoje,
      saldo_inicial: n(form.saldo_inicial),
      dinheiro: n(form.dinheiro),
      pix: n(form.pix),
      cartao: n(form.cartao),
      sangrias: n(form.sangrias),
      suprimentos: n(form.suprimentos),
      saidas: n(form.saidas),
      valor_caixa_declarado: n(form.valor_caixa_declarado) || null,
      status: fechar ? 'FECHADO_PENDENTE_CONCILIACAO' as const : 'ABERTO' as const,
      responsavel_usuario_id: profile.user_id,
      responsavel_nome_snapshot: profile.nome,
    };

    let error;
    if (fechamentoId) {
      ({ error } = await supabase.from('fechamentos').update(payload).eq('id', fechamentoId));
    } else {
      const res = await supabase.from('fechamentos').insert(payload).select('id').single();
      error = res.error;
      if (res.data) setFechamentoId(res.data.id);
    }

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      if (fechar) setStatus('FECHADO_PENDENTE_CONCILIACAO');
      toast({ title: fechar ? 'Caixa fechado!' : 'Salvo com sucesso!' });
    }
    setSaving(false);
  };

  const fields = [
    { key: 'saldo_inicial', label: 'Saldo Inicial' },
    { key: 'dinheiro', label: 'Dinheiro' },
    { key: 'pix', label: 'PIX' },
    { key: 'cartao', label: 'Cartão' },
    { key: 'sangrias', label: 'Sangrias' },
    { key: 'suprimentos', label: 'Suprimentos' },
    { key: 'saidas', label: 'Saídas' },
    { key: 'valor_caixa_declarado', label: 'Valor Declarado no Caixa' },
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
            Lançamento do Dia
            {isLocked && <Lock className="h-4 w-4 text-warning" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  type="number"
                  step="0.01"
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  disabled={isLocked}
                  placeholder="0,00"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-xl font-bold text-foreground">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Saldo Final</p>
                <p className="text-xl font-bold text-foreground">R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
          </div>

          {!isLocked && (
            <div className="mt-6 flex gap-3">
              <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" className="gap-2">
                <Save className="h-4 w-4" /> Salvar
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
                <Lock className="h-4 w-4" /> Fechar Caixa
              </Button>
            </div>
          )}

          {isLocked && (
            <p className="mt-4 text-sm text-warning">Caixa fechado. Somente o financeiro pode reabrir.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
