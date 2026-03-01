import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Manutencao, NewManutencao, UpdateManutencao } from "./types";

export const useMaintenanceServices = (empresaId: string | undefined) => {
    return useQuery({
        queryKey: ['maintenance', empresaId],
        queryFn: async () => {
            if (!empresaId) return [];
            const { data, error } = await (supabase
                .from('manutencoes' as any)
                .select('*')
                .eq('empresa_id', empresaId)
                .order('created_at', { ascending: false }) as any);

            if (error) throw error;
            return (data ?? []) as Manutencao[];
        },
        enabled: !!empresaId,
    });
};

export const useCreateMaintenance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newService: NewManutencao) => {
            const { data, error } = await (supabase.from('manutencoes' as any).insert(newService as any).select().single() as any);
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['maintenance', variables.empresa_id] });
        },
    });
};

export const useUpdateMaintenance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: UpdateManutencao & { id: string }) => {
            const { data: updatedData, error } = await (supabase.from('manutencoes' as any).update(data as any).eq('id', id).select().single() as any);
            if (error) throw error;
            return updatedData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        },
    });
};

export const useDeleteMaintenance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase.from('manutencoes' as any).delete().eq('id', id) as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        },
    });
};
