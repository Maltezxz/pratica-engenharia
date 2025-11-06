import { supabase } from '../lib/supabase';

/**
 * Obtém todos os host_ids vinculados ao host fornecido
 * Hosts vinculados são tratados como uma única empresa/conta
 */
export async function getLinkedHostIds(hostId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_linked_host_ids', {
      input_host_id: hostId
    });

    if (error) {
      console.error('Erro ao buscar hosts vinculados:', error);
      return [hostId];
    }

    return data || [hostId];
  } catch (error) {
    console.error('Erro ao buscar hosts vinculados:', error);
    return [hostId];
  }
}
