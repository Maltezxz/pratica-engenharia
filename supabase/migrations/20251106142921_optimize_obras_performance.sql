/*
  # Otimização de Performance - Obras e Ferramentas

  1. Melhorias de Performance
    - Adiciona índice composto otimizado para obras ativas
    - Adiciona índice para status de ferramentas
    - Adiciona índice para permissões por host_id
    - Remove índices redundantes se existirem
    - Atualiza estatísticas das tabelas

  2. Observações
    - Esses índices aceleram consultas frequentes em obras e ferramentas
    - Consultas filtradas por status ficam mais rápidas
    - Lookup de permissões fica mais eficiente
*/

-- Drop índices antigos que podem estar causando lentidão no planning
DROP INDEX IF EXISTS idx_obras_status_created;

-- Criar índice otimizado para obras ativas (query mais comum)
CREATE INDEX IF NOT EXISTS idx_obras_status_active_only ON obras (created_at DESC) 
WHERE status = 'ativa';

-- Índice para ferramentas não desaparecidas (query comum)
CREATE INDEX IF NOT EXISTS idx_ferramentas_status_active ON ferramentas (current_type, current_id) 
WHERE status != 'desaparecida';

-- Índice para contagem de desaparecidos
CREATE INDEX IF NOT EXISTS idx_ferramentas_desaparecida ON ferramentas (id) 
WHERE status = 'desaparecida';

-- Índice para permissões de obras por host
CREATE INDEX IF NOT EXISTS idx_user_obra_permissions_host ON user_obra_permissions (host_id, user_id);

-- Índice para permissões de ferramentas por host
CREATE INDEX IF NOT EXISTS idx_user_ferramenta_permissions_host ON user_ferramenta_permissions (host_id, user_id);

-- Atualizar estatísticas para melhorar o query planner
ANALYZE obras;
ANALYZE ferramentas;
ANALYZE user_obra_permissions;
ANALYZE user_ferramenta_permissions;
