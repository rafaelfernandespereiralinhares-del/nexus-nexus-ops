export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      auditorias: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string
          id: string
          loja_id: string
          status: Database["public"]["Enums"]["auditoria_status"]
          tipo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          loja_id: string
          status?: Database["public"]["Enums"]["auditoria_status"]
          tipo: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          loja_id?: string
          status?: Database["public"]["Enums"]["auditoria_status"]
          tipo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auditorias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditorias_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacoes: {
        Row: {
          created_at: string
          data: string
          diferenca: number | null
          empresa_id: string
          id: string
          loja_id: string
          status: Database["public"]["Enums"]["conciliacao_status"]
          updated_at: string
          valor_caixa: number
          valor_pdv: number
        }
        Insert: {
          created_at?: string
          data: string
          diferenca?: number | null
          empresa_id: string
          id?: string
          loja_id: string
          status?: Database["public"]["Enums"]["conciliacao_status"]
          updated_at?: string
          valor_caixa?: number
          valor_pdv?: number
        }
        Update: {
          created_at?: string
          data?: string
          diferenca?: number | null
          empresa_id?: string
          id?: string
          loja_id?: string
          status?: Database["public"]["Enums"]["conciliacao_status"]
          updated_at?: string
          valor_caixa?: number
          valor_pdv?: number
        }
        Relationships: [
          {
            foreignKeyName: "conciliacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacoes_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          created_at: string
          data_pagamento: string | null
          empresa_id: string
          fornecedor: string
          id: string
          loja_id: string
          status: Database["public"]["Enums"]["conta_pagar_status"]
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          empresa_id: string
          fornecedor: string
          id?: string
          loja_id: string
          status?: Database["public"]["Enums"]["conta_pagar_status"]
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          empresa_id?: string
          fornecedor?: string
          id?: string
          loja_id?: string
          status?: Database["public"]["Enums"]["conta_pagar_status"]
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          cliente: string
          created_at: string
          data_pagamento: string | null
          empresa_id: string
          etapa_cobranca: Database["public"]["Enums"]["etapa_cobranca"] | null
          id: string
          loja_id: string
          status: Database["public"]["Enums"]["conta_receber_status"]
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          cliente: string
          created_at?: string
          data_pagamento?: string | null
          empresa_id: string
          etapa_cobranca?: Database["public"]["Enums"]["etapa_cobranca"] | null
          id?: string
          loja_id: string
          status?: Database["public"]["Enums"]["conta_receber_status"]
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          cliente?: string
          created_at?: string
          data_pagamento?: string | null
          empresa_id?: string
          etapa_cobranca?: Database["public"]["Enums"]["etapa_cobranca"] | null
          id?: string
          loja_id?: string
          status?: Database["public"]["Enums"]["conta_receber_status"]
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          plano_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          plano_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          plano_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos: {
        Row: {
          cartao: number
          created_at: string
          data: string
          deleted_at: string | null
          dinheiro: number
          empresa_id: string
          id: string
          loja_id: string
          pix: number
          responsavel_nome_snapshot: string | null
          responsavel_usuario_id: string | null
          saidas: number
          saldo_final: number | null
          saldo_inicial: number
          sangrias: number
          status: Database["public"]["Enums"]["fechamento_status"]
          suprimentos: number
          total_entradas: number | null
          updated_at: string
          valor_caixa_declarado: number | null
        }
        Insert: {
          cartao?: number
          created_at?: string
          data: string
          deleted_at?: string | null
          dinheiro?: number
          empresa_id: string
          id?: string
          loja_id: string
          pix?: number
          responsavel_nome_snapshot?: string | null
          responsavel_usuario_id?: string | null
          saidas?: number
          saldo_final?: number | null
          saldo_inicial?: number
          sangrias?: number
          status?: Database["public"]["Enums"]["fechamento_status"]
          suprimentos?: number
          total_entradas?: number | null
          updated_at?: string
          valor_caixa_declarado?: number | null
        }
        Update: {
          cartao?: number
          created_at?: string
          data?: string
          deleted_at?: string | null
          dinheiro?: number
          empresa_id?: string
          id?: string
          loja_id?: string
          pix?: number
          responsavel_nome_snapshot?: string | null
          responsavel_usuario_id?: string | null
          saidas?: number
          saldo_final?: number | null
          saldo_inicial?: number
          sangrias?: number
          status?: Database["public"]["Enums"]["fechamento_status"]
          suprimentos?: number
          total_entradas?: number | null
          updated_at?: string
          valor_caixa_declarado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechamentos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          acao: string
          antes_json: Json | null
          created_at: string
          depois_json: Json | null
          empresa_id: string
          entidade: string
          entidade_id: string | null
          id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          antes_json?: Json | null
          created_at?: string
          depois_json?: Json | null
          empresa_id: string
          entidade: string
          entidade_id?: string | null
          id?: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          antes_json?: Json | null
          created_at?: string
          depois_json?: Json | null
          empresa_id?: string
          entidade?: string
          entidade_id?: string | null
          id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          ativa: boolean
          created_at: string
          empresa_id: string
          id: string
          nome: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          nome: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "lojas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          loja_id: string
          mes: string
          meta_diaria: number
          meta_mensal: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          loja_id: string
          mes: string
          meta_diaria?: number
          meta_mensal?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          loja_id?: string
          mes?: string
          meta_diaria?: number
          meta_mensal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          created_at: string
          id: string
          limite_lojas: number
          limite_relatorios_ia_mensal: number
          limite_usuarios: number
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          limite_lojas?: number
          limite_relatorios_ia_mensal?: number
          limite_usuarios?: number
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          limite_lojas?: number
          limite_relatorios_ia_mensal?: number
          limite_usuarios?: number
          nome?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          email: string
          empresa_id: string | null
          id: string
          loja_id: string | null
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          email: string
          empresa_id?: string | null
          id?: string
          loja_id?: string | null
          nome: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          email?: string
          empresa_id?: string | null
          id?: string
          loja_id?: string | null
          nome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_ia: {
        Row: {
          created_at: string
          data: string
          empresa_id: string
          id: string
          texto: string
        }
        Insert: {
          created_at?: string
          data?: string
          empresa_id: string
          id?: string
          texto: string
        }
        Update: {
          created_at?: string
          data?: string
          empresa_id?: string
          id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_ia_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_empresa_id: { Args: never; Returns: string }
      get_user_loja_id: { Args: never; Returns: string }
      has_any_role: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "ADMIN" | "DIRETORIA" | "FINANCEIRO" | "LOJA"
      auditoria_status: "ABERTA" | "EM_ANALISE" | "RESOLVIDA"
      conciliacao_status: "OK" | "DIVERGENCIA" | "ANALISE"
      conta_pagar_status: "ABERTO" | "PAGO" | "ATRASADO"
      conta_receber_status: "ABERTO" | "PAGO" | "ATRASADO" | "NEGOCIADO"
      etapa_cobranca: "D1" | "D7" | "D15" | "D30" | "JURIDICO"
      fechamento_status:
        | "ABERTO"
        | "FECHADO_PENDENTE_CONCILIACAO"
        | "CONCILIADO_OK"
        | "CONCILIADO_DIVERGENCIA"
        | "REABERTO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMIN", "DIRETORIA", "FINANCEIRO", "LOJA"],
      auditoria_status: ["ABERTA", "EM_ANALISE", "RESOLVIDA"],
      conciliacao_status: ["OK", "DIVERGENCIA", "ANALISE"],
      conta_pagar_status: ["ABERTO", "PAGO", "ATRASADO"],
      conta_receber_status: ["ABERTO", "PAGO", "ATRASADO", "NEGOCIADO"],
      etapa_cobranca: ["D1", "D7", "D15", "D30", "JURIDICO"],
      fechamento_status: [
        "ABERTO",
        "FECHADO_PENDENTE_CONCILIACAO",
        "CONCILIADO_OK",
        "CONCILIADO_DIVERGENCIA",
        "REABERTO",
      ],
    },
  },
} as const
