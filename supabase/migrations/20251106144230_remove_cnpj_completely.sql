/*
  # Remover campo CNPJ completamente do sistema

  1. Alterações
    - Remove coluna cnpj da tabela users
    - Remove todos os índices relacionados ao CNPJ
    - Atualiza constraint de email para ser único globalmente

  2. Observações
    - Login passa a ser apenas por nome de usuário + senha
    - Cada usuário tem nome único no sistema
    - Hosts não precisam mais de CNPJ
*/

-- Remove índices relacionados ao CNPJ se existirem
DROP INDEX IF EXISTS idx_users_cnpj;
DROP INDEX IF EXISTS idx_users_cnpj_role;

-- Remove a coluna CNPJ da tabela users
ALTER TABLE users DROP COLUMN IF EXISTS cnpj;

-- Garante que o nome de usuário seja único globalmente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_name_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_name_key UNIQUE (name);
  END IF;
END $$;

-- Atualizar estatísticas
ANALYZE users;
