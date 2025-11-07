import { supabase } from '../lib/supabase';

interface HistoricoData {
  tipo_evento: string;
  descricao: string;
  obra_id?: string;
  movimentacao_id?: string;
  user_id?: string;
  owner_id?: string;
  metadata?: Record<string, unknown>;
}

export async function insertHistorico(data: HistoricoData): Promise<void> {
  try {
    const { error } = await supabase
      .from('historico')
      .insert(data);

    if (error) {
      console.error('Erro ao inserir histórico:', error);
    }
  } catch (error) {
    console.error('Erro ao inserir histórico:', error);
  }
}
