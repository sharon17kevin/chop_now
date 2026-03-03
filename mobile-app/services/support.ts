import { supabase } from '@/lib/supabase';

export const SupportService = {
    async createTicket(ticket: {
        user_id: string;
        subject: string;
        category: string;
        description: string;
        status: string;
        priority: string;
    }) {
        const { data, error } = await supabase
            .from('support_tickets')
            .insert(ticket)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};
