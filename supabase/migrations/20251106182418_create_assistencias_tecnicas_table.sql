/*
  # Criar tabela de Assistências Técnicas

  1. Nova Tabela
    - `assistencias_tecnicas`
      - `id` (uuid, primary key)
      - `name` (text, nome da assistência técnica)
      - `endereco` (text, endereço/localização)
      - `contato` (text, telefone/email de contato)
      - `observacoes` (text, informações complementares)
      - `status` (text, ativa/inativa)
      - `owner_id` (uuid, referência ao usuário que criou)
      - `created_at` (timestamptz, data de criação)
      - `updated_at` (timestamptz, data de atualização)

  2. Segurança
    - Habilitar RLS na tabela
    - Políticas para usuários autenticados

  3. Índices
    - Índice em owner_id para performance
    - Índice em status para filtros rápidos
*/

-- Criar tabela de assistências técnicas
CREATE TABLE IF NOT EXISTS assistencias_tecnicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  endereco text,
  contato text,
  observacoes text,
  status text DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
  owner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE assistencias_tecnicas ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de assistências técnicas para todos usuários autenticados
CREATE POLICY "Usuários podem visualizar assistências técnicas"
  ON assistencias_tecnicas
  FOR SELECT
  USING (true);

-- Política para permitir inserção (hosts podem criar)
CREATE POLICY "Usuários podem criar assistências técnicas"
  ON assistencias_tecnicas
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir atualização
CREATE POLICY "Usuários podem atualizar assistências técnicas"
  ON assistencias_tecnicas
  FOR UPDATE
  USING (true);

-- Política para permitir exclusão
CREATE POLICY "Usuários podem deletar assistências técnicas"
  ON assistencias_tecnicas
  FOR DELETE
  USING (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_assistencias_owner ON assistencias_tecnicas(owner_id);
CREATE INDEX IF NOT EXISTS idx_assistencias_status ON assistencias_tecnicas(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_assistencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_assistencias_updated_at ON assistencias_tecnicas;
CREATE TRIGGER trigger_update_assistencias_updated_at
  BEFORE UPDATE ON assistencias_tecnicas
  FOR EACH ROW
  EXECUTE FUNCTION update_assistencias_updated_at();
