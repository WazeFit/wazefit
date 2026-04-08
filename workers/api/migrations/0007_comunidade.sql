-- Posts do feed
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_tipo TEXT NOT NULL CHECK(user_tipo IN ('expert','aluno')),
  user_nome TEXT NOT NULL,
  conteudo TEXT,
  tipo TEXT DEFAULT 'texto' CHECK(tipo IN ('texto','foto','treino','conquista','desafio')),
  midia_url TEXT,
  execucao_id TEXT,
  badge_id TEXT,
  curtidas_count INTEGER DEFAULT 0,
  comentarios_count INTEGER DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_tenant ON posts(tenant_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, criado_em DESC);

-- Curtidas
CREATE TABLE IF NOT EXISTS curtidas (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  tipo TEXT DEFAULT 'like' CHECK(tipo IN ('like','forca','fogo','aplausos','coracao')),
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_curtidas_post ON curtidas(post_id);

-- Comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_comentarios_post ON comentarios(post_id, criado_em);

-- Desafios
CREATE TABLE IF NOT EXISTS desafios (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expert_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'individual' CHECK(tipo IN ('individual','equipe','comunidade')),
  meta_tipo TEXT NOT NULL,
  meta_valor INTEGER NOT NULL,
  data_inicio TEXT NOT NULL,
  data_fim TEXT NOT NULL,
  ativo INTEGER DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_desafios_tenant ON desafios(tenant_id, ativo);

-- Participantes do desafio
CREATE TABLE IF NOT EXISTS desafio_participantes (
  id TEXT PRIMARY KEY,
  desafio_id TEXT NOT NULL REFERENCES desafios(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  progresso INTEGER DEFAULT 0,
  concluido INTEGER DEFAULT 0,
  posicao INTEGER,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(desafio_id, user_id)
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT NOT NULL,
  categoria TEXT CHECK(categoria IN ('streak','milestone','desafio','social','secreto')),
  raridade TEXT DEFAULT 'comum' CHECK(raridade IN ('comum','raro','epico','lendario')),
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Badges conquistados
CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL REFERENCES badges(id),
  conquistado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
