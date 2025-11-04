/*
  # Sistema de Gerenciamento de Construção - Schema Completo

  ## Visão Geral
  Sistema para gerenciar obras, ferramentas, funcionários e movimentações.
  Dois tipos de usuários: Host (engenheiro) e Funcionario (empregado).

  ## Tabelas Criadas

  ### 1. users
  Armazena informações de usuários e suas funções
  - `id` (uuid, PK) - Identificador único do usuário
  - `user_id` (integer) - ID numérico para referência
  - `name` (text) - Nome completo
  - `email` (text, unique) - Email único
  - `cnpj` (text) - CNPJ da empresa (para hosts)
  - `role` (text) - Função: 'host' ou 'funcionario'
  - `host_id` (uuid) - Referência ao host (para funcionários)
  - `created_at`, `updated_at` (timestamptz)

  ### 2. obras
  Projetos de construção
  - `id` (uuid, PK)
  - `title` (text) - Nome da obra
  - `description` (text) - Descrição
  - `endereco` (text) - Endereço
  - `status` (text) - 'ativa' ou 'finalizada'
  - `owner_id` (uuid) - Dono da obra (host)
  - `start_date`, `end_date` (date)
  - `engenheiro` (text) - Nome do engenheiro
  - `image_url` (text) - URL da imagem principal

  ### 3. estabelecimentos
  Locais de armazenamento permanente
  - `id` (uuid, PK)
  - `name` (text) - Nome do local
  - `endereco` (text) - Endereço
  - `owner_id` (uuid) - Dono (host)

  ### 4. ferramentas
  Ferramentas e equipamentos com rastreamento completo
  - `id` (uuid, PK)
  - `name` (text) - Nome da ferramenta
  - `tipo` (text) - Tipo/categoria
  - `modelo`, `serial`, `marca` (text)
  - `status` (text) - 'disponivel', 'em_uso', 'desaparecida'
  - `current_type`, `current_id` - Localização atual
  - `cadastrado_por`, `owner_id` (uuid)
  - Campos adicionais: NF, valor, garantia, lacres, etc.

  ### 5. movimentacoes
  Histórico de movimentação de ferramentas
  - `id` (uuid, PK)
  - `ferramenta_id` (uuid) - Ferramenta movida
  - `from_type`, `from_id` - Origem
  - `to_type`, `to_id` - Destino
  - `user_id` (uuid) - Quem moveu
  - `note` (text) - Observação

  ### 6. historico
  Eventos e ações do sistema
  - `id` (uuid, PK)
  - `tipo_evento` (text) - Tipo: 'obra_criada', 'obra_finalizada', 'movimentacao'
  - `descricao` (text)
  - `obra_id`, `movimentacao_id` (uuid, opcionais)
  - `user_id`, `owner_id` (uuid)
  - `metadata` (jsonb)

  ### 7. obra_images
  Múltiplas imagens por obra
  - `id` (uuid, PK)
  - `obra_id` (uuid)
  - `image_url` (text)
  - `description` (text)
  - `display_order` (integer)

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas permissivas para permitir acesso completo (sem autenticação Supabase Auth)
  - Hosts controlam seus dados e de seus funcionários
  - Funcionários acessam dados do seu host

  ## Performance
  - Índices em colunas frequentemente consultadas
  - Triggers para updated_at automático
*/

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id serial UNIQUE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  cnpj text,
  role text NOT NULL CHECK (role IN ('host', 'funcionario')),
  host_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. OBRAS TABLE
CREATE TABLE IF NOT EXISTS obras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  endereco text NOT NULL,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'finalizada')),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  engenheiro text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. ESTABELECIMENTOS TABLE
CREATE TABLE IF NOT EXISTS estabelecimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  endereco text NOT NULL,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. FERRAMENTAS TABLE
CREATE TABLE IF NOT EXISTS ferramentas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tipo text DEFAULT '',
  modelo text DEFAULT '',
  serial text DEFAULT '',
  status text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_uso', 'desaparecida')),
  current_type text CHECK (current_type IN ('obra', 'estabelecimento')),
  current_id uuid,
  cadastrado_por uuid NOT NULL REFERENCES users(id),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  descricao text DEFAULT '',
  nf text DEFAULT '',
  nf_image_url text,
  image_url text,
  data text,
  valor numeric(10, 2),
  tempo_garantia_dias integer,
  garantia text DEFAULT '',
  marca text DEFAULT '',
  numero_lacre text DEFAULT '',
  numero_placa text DEFAULT '',
  adesivo text DEFAULT '',
  usuario text DEFAULT '',
  obra text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. MOVIMENTACOES TABLE
CREATE TABLE IF NOT EXISTS movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ferramenta_id uuid NOT NULL REFERENCES ferramentas(id) ON DELETE CASCADE,
  from_type text,
  from_id uuid,
  to_type text NOT NULL,
  to_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id),
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 6. HISTORICO TABLE
CREATE TABLE IF NOT EXISTS historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento text NOT NULL CHECK (tipo_evento IN ('obra_criada', 'obra_finalizada', 'movimentacao')),
  descricao text NOT NULL,
  obra_id uuid REFERENCES obras(id) ON DELETE CASCADE,
  movimentacao_id uuid REFERENCES movimentacoes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 7. OBRA_IMAGES TABLE
CREATE TABLE IF NOT EXISTS obra_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  description text DEFAULT '',
  display_order integer DEFAULT 0,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE obra_images ENABLE ROW LEVEL SECURITY;

-- CREATE PERMISSIVE POLICIES (Allow all operations)
-- This allows the app to work without Supabase Auth

CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on obras" ON obras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on estabelecimentos" ON estabelecimentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ferramentas" ON ferramentas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on movimentacoes" ON movimentacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on historico" ON historico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on obra_images" ON obra_images FOR ALL USING (true) WITH CHECK (true);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_host_id ON users(host_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_cnpj ON users(cnpj) WHERE cnpj IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_obras_owner_id ON obras(owner_id);
CREATE INDEX IF NOT EXISTS idx_obras_status ON obras(status);

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_owner_id ON estabelecimentos(owner_id);

CREATE INDEX IF NOT EXISTS idx_ferramentas_owner_id ON ferramentas(owner_id);
CREATE INDEX IF NOT EXISTS idx_ferramentas_current ON ferramentas(current_type, current_id);
CREATE INDEX IF NOT EXISTS idx_ferramentas_status ON ferramentas(status);
CREATE INDEX IF NOT EXISTS idx_ferramentas_marca ON ferramentas(marca) WHERE marca != '';
CREATE INDEX IF NOT EXISTS idx_ferramentas_numero_lacre ON ferramentas(numero_lacre) WHERE numero_lacre != '';
CREATE INDEX IF NOT EXISTS idx_ferramentas_numero_placa ON ferramentas(numero_placa) WHERE numero_placa != '';

CREATE INDEX IF NOT EXISTS idx_movimentacoes_ferramenta_id ON movimentacoes(ferramenta_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_user_id ON movimentacoes(user_id);

CREATE INDEX IF NOT EXISTS idx_historico_owner_id ON historico(owner_id);
CREATE INDEX IF NOT EXISTS idx_historico_tipo_evento ON historico(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_historico_created_at ON historico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_obra_id ON historico(obra_id) WHERE obra_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_obra_images_obra_id ON obra_images(obra_id);
CREATE INDEX IF NOT EXISTS idx_obra_images_display_order ON obra_images(obra_id, display_order);

-- CREATE FUNCTION TO UPDATE updated_at AUTOMATICALLY
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGERS FOR updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_obras_updated_at ON obras;
CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON obras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_estabelecimentos_updated_at ON estabelecimentos;
CREATE TRIGGER update_estabelecimentos_updated_at
  BEFORE UPDATE ON estabelecimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ferramentas_updated_at ON ferramentas;
CREATE TRIGGER update_ferramentas_updated_at
  BEFORE UPDATE ON ferramentas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();