/*
  # Sistema de Hosts Vinculados (Mesma Empresa)

  ## Descrição
  Este sistema permite que múltiplos hosts sejam tratados como uma única empresa,
  compartilhando ferramentas, obras, funcionários e todos os recursos.

  ## Caso de Uso
  - bercoon@gmail.com e fernando@praticaengenharia.com.br são a MESMA empresa
  - Todos os funcionários devem ver ferramentas/obras de AMBOS os hosts
  - Quando um host está logado, ele vê recursos de todos os hosts vinculados a ele

  ## Estrutura
  1. Nova Tabela: `linked_hosts`
     - Armazena os vínculos entre hosts da mesma empresa
     - Relacionamento bidirecional (A vinculado a B = B vinculado a A)

  2. Função: `get_linked_host_ids(host_id)`
     - Retorna array com o host_id + todos os hosts vinculados a ele
     - Exemplo: fernando → [fernando_id, bercoon_id]

  ## Segurança
  - RLS desabilitado (tabela de configuração interna)
  - Apenas administradores devem poder modificar vínculos
*/

-- Criar tabela de hosts vinculados
CREATE TABLE IF NOT EXISTS linked_hosts (
  host_id_1 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_id_2 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (host_id_1, host_id_2),
  CHECK (host_id_1 < host_id_2)
);

-- Desabilitar RLS (tabela de configuração)
ALTER TABLE linked_hosts DISABLE ROW LEVEL SECURITY;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_linked_hosts_1 ON linked_hosts(host_id_1);
CREATE INDEX IF NOT EXISTS idx_linked_hosts_2 ON linked_hosts(host_id_2);

-- Função para obter todos os host_ids vinculados (incluindo o próprio)
CREATE OR REPLACE FUNCTION get_linked_host_ids(input_host_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_ids uuid[];
BEGIN
  -- Buscar todos os hosts vinculados (em ambas as direções)
  SELECT ARRAY_AGG(DISTINCT linked_host)
  INTO linked_ids
  FROM (
    -- Host está na coluna 1
    SELECT host_id_2 as linked_host
    FROM linked_hosts
    WHERE host_id_1 = input_host_id
    
    UNION
    
    -- Host está na coluna 2
    SELECT host_id_1 as linked_host
    FROM linked_hosts
    WHERE host_id_2 = input_host_id
    
    UNION
    
    -- Incluir o próprio host
    SELECT input_host_id as linked_host
  ) all_hosts;
  
  -- Se não houver vínculos, retornar apenas o próprio host
  IF linked_ids IS NULL THEN
    linked_ids := ARRAY[input_host_id];
  END IF;
  
  RETURN linked_ids;
END;
$$;

-- Inserir vínculo entre bercoon e fernando (mesma empresa)
INSERT INTO linked_hosts (host_id_1, host_id_2)
VALUES (
  '0357ea28-b426-44b3-a45d-a5df05ecb7c3',  -- bercoon@gmail.com
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'   -- fernando@praticaengenharia.com.br
)
ON CONFLICT (host_id_1, host_id_2) DO NOTHING;