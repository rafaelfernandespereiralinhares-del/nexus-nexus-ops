import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Save } from 'lucide-react';
import type { PremiacaoConfig } from '../types';

const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function PremiacaoTab() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const now = new Date();
  const [filterMes, setFilterMes] = useState(String(now.getMonth()));
  const [filterAno, setFilterAno] = useState(String(now.getFullYear()));
  const mesStr = `${filterAno}-${String(parseInt(filterMes) + 1).padStart(2, '0')}`;

  const [config, setConfig] = useState<PremiacaoConfig | null>(null);
  const [form, setForm] = useState({
    premio_diario_faixa1_mult: '1.0', premio_diario_faixa1_valor: '30',
    premio_diario_faixa2_mult: '1.2', premio_diario_faixa2_valor: '50',
    premio_diario_faixa3_mult: '1.5', premio_diario_faixa3_valor: '80',
    premio_diario_faixa4_mult: '2.0', premio_diario_faixa4_valor: '120',
    premio_semanal_valor: '100', premio_semanal_min_participacao: '0.7',
    premio_mensal_vendedor_valor: '100', premio_mensal_vendedor_min_participacao: '1.0',
    premio_mensal_loja_valor: '150', premio_mensal_loja_min_participacao: '0.7',
    multiplicador_meta_final: '1.2',
  });

  useEffect(() => {
    fetchConfig();
  }, [profile, filterMes, filterAno]);

  const fetchConfig = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await (supabase.from('premiacao_config' as any).select('*')
      .eq('empresa_id', profile.empresa_id).eq('mes', mesStr).maybeSingle() as any);
    if (data) {
      setConfig(data as PremiacaoConfig);
      setForm({
        premio_diario_faixa1_mult: String(data.premio_diario_faixa1_mult),
        premio_diario_faixa1_valor: String(data.premio_diario_faixa1_valor),
        premio_diario_faixa2_mult: String(data.premio_diario_faixa2_mult),
        premio_diario_faixa2_valor: String(data.premio_diario_faixa2_valor),
        premio_diario_faixa3_mult: String(data.premio_diario_faixa3_mult),
        premio_diario_faixa3_valor: String(data.premio_diario_faixa3_valor),
        premio_diario_faixa4_mult: String(data.premio_diario_faixa4_mult),
        premio_diario_faixa4_valor: String(data.premio_diario_faixa4_valor),
        premio_semanal_valor: String(data.premio_semanal_valor),
        premio_semanal_min_participacao: String(data.premio_semanal_min_participacao),
        premio_mensal_vendedor_valor: String(data.premio_mensal_vendedor_valor),
        premio_mensal_vendedor_min_participacao: String(data.premio_mensal_vendedor_min_participacao),
        premio_mensal_loja_valor: String(data.premio_mensal_loja_valor),
        premio_mensal_loja_min_participacao: String(data.premio_mensal_loja_min_participacao),
        multiplicador_meta_final: String(data.multiplicador_meta_final),
      });
    } else {
      setConfig(null);
    }
  };

  const handleSave = async () => {
    if (!profile?.empresa_id) return;
    const payload = {
      empresa_id: profile.empresa_id,
      mes: mesStr,
      premio_diario_faixa1_mult: parseFloat(form.premio_diario_faixa1_mult),
      premio_diario_faixa1_valor: parseFloat(form.premio_diario_faixa1_valor),
      premio_diario_faixa2_mult: parseFloat(form.premio_diario_faixa2_mult),
      premio_diario_faixa2_valor: parseFloat(form.premio_diario_faixa2_valor),
      premio_diario_faixa3_mult: parseFloat(form.premio_diario_faixa3_mult),
      premio_diario_faixa3_valor: parseFloat(form.premio_diario_faixa3_valor),
      premio_diario_faixa4_mult: parseFloat(form.premio_diario_faixa4_mult),
      premio_diario_faixa4_valor: parseFloat(form.premio_diario_faixa4_valor),
      premio_semanal_valor: parseFloat(form.premio_semanal_valor),
      premio_semanal_min_participacao: parseFloat(form.premio_semanal_min_participacao),
      premio_mensal_vendedor_valor: parseFloat(form.premio_mensal_vendedor_valor),
      premio_mensal_vendedor_min_participacao: parseFloat(form.premio_mensal_vendedor_min_participacao),
      premio_mensal_loja_valor: parseFloat(form.premio_mensal_loja_valor),
      premio_mensal_loja_min_participacao: parseFloat(form.premio_mensal_loja_min_participacao),
      multiplicador_meta_final: parseFloat(form.multiplicador_meta_final),
    };

    const { error } = await (supabase.from('premiacao_config' as any)
      .upsert(payload as any, { onConflict: 'empresa_id,mes' }) as any);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Premiação salva!' }); fetchConfig(); }
  };

  const Field = ({ label, field, suffix }: { label: string; field: keyof typeof form; suffix?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        <Input type="number" step="0.01" className="h-8 text-sm"
          value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
        {suffix && <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Select value={filterMes} onValueChange={setFilterMes}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>{meses.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterAno} onValueChange={setFilterAno}>
          <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleSave} className="gap-2 ml-auto"><Save className="h-4 w-4" /> Salvar</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Premiação Diária */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-warning" /> Premiação Diária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Faixa 1 (Mult.)" field="premio_diario_faixa1_mult" suffix="×" />
              <Field label="Prêmio" field="premio_diario_faixa1_valor" suffix="R$" />
              <Field label="Faixa 2 (Mult.)" field="premio_diario_faixa2_mult" suffix="×" />
              <Field label="Prêmio" field="premio_diario_faixa2_valor" suffix="R$" />
              <Field label="Faixa 3 (Mult.)" field="premio_diario_faixa3_mult" suffix="×" />
              <Field label="Prêmio" field="premio_diario_faixa3_valor" suffix="R$" />
              <Field label="Faixa 4 (Mult.)" field="premio_diario_faixa4_mult" suffix="×" />
              <Field label="Prêmio" field="premio_diario_faixa4_valor" suffix="R$" />
            </div>
            <p className="text-xs text-muted-foreground">
              Ex: Faixa 1 = 1.0× → vendedor que atingir 100% da meta diária ganha R$ {form.premio_diario_faixa1_valor}
            </p>
          </CardContent>
        </Card>

        {/* Premiação Semanal + Mensal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-primary" /> Premiação Semanal & Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-2">Semanal</Badge>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor Prêmio" field="premio_semanal_valor" suffix="R$" />
                <Field label="Mín. Participação" field="premio_semanal_min_participacao" suffix="%" />
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Mensal Vendedor</Badge>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor Prêmio" field="premio_mensal_vendedor_valor" suffix="R$" />
                <Field label="Mín. Participação" field="premio_mensal_vendedor_min_participacao" suffix="%" />
              </div>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Mensal Loja</Badge>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor Prêmio" field="premio_mensal_loja_valor" suffix="R$" />
                <Field label="Mín. Participação" field="premio_mensal_loja_min_participacao" suffix="%" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parâmetros Gerais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Parâmetros Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Multiplicador Meta Final" field="multiplicador_meta_final" suffix="×" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Meta Final = Meta Base × {form.multiplicador_meta_final}. Pesos semanais: 35%, 25%, 20%, 20%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
