/*
  # Otimização de Performance de Queries

  ## Objetivo
  Adicionar índices compostos para otimizar as queries mais comuns do sistema,
  especialmente na tela Home que carrega múltiplas tabelas.

  ## Índices Adicionados

  ### 1. users
  - Índice composto (role, cnpj) para buscar hosts da mesma empresa rapidamente
  
  ### 2. obras
  - Índice composto (owner_id, status) para filtrar obras ativas por owner
  - Índice composto (status, created_at) para ordenação de obras ativas
  
  ### 3. ferramentas
  - Índice composto (owner_id, status) para filtrar ferramentas por status
  - Índice composto (current_type, current_id) para localização rápida
  
  ### 4. historico
  - Índice composto (owner_id, created_at) para histórico recente
  
  ## Performance Esperada
  - Redução de 50-70% no tempo de carregamento da Home
  - Queries complexas com JOIN/IN otimizadas
  - Melhor performance para usuarios com muitos dados
*/

-- Índice composto para buscar hosts da mesma empresa (usado no login e cache)
CREATE INDEX IF NOT EXISTS idx_users_role_cnpj 
  ON users(role, cnpj) 
  WHERE role = 'host' AND cnpj IS NOT NULL;

-- Índice composto para obras ativas por owner (query mais comum na Home)
CREATE INDEX IF NOT EXISTS idx_obras_owner_status 
  ON obras(owner_id, status);

-- Índice composto para ordenação de obras por status e data
CREATE INDEX IF NOT EXISTS idx_obras_status_created 
  ON obras(status, created_at DESC) 
  WHERE status = 'ativa';

-- Índice composto para ferramentas por owner e status
CREATE INDEX IF NOT EXISTS idx_ferramentas_owner_status 
  ON ferramentas(owner_id, status);

-- Índice composto para localização de ferramentas
CREATE INDEX IF NOT EXISTS idx_ferramentas_location 
  ON ferramentas(current_type, current_id) 
  WHERE current_type IS NOT NULL AND current_id IS NOT NULL;

-- Índice composto para histórico recente por owner
CREATE INDEX IF NOT EXISTS idx_historico_owner_created 
  ON historico(owner_id, created_at DESC);

-- Índice para funcionários por host_id (otimizar busca de equipe)
CREATE INDEX IF NOT EXISTS idx_users_host_role 
  ON users(host_id, role) 
  WHERE host_id IS NOT NULL;

-- Estatísticas do banco para otimizar plano de execução
ANALYZE users;
ANALYZE obras;
ANALYZE ferramentas;
ANALYZE historico;
ANALYZE estabelecimentos;