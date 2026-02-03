-- PostgreSQL-compatible schema for alimentto
-- This script is intended to be run by the Postgres docker entrypoint
-- which executes scripts against the database defined by POSTGRES_DB.

CREATE TABLE IF NOT EXISTS pessoas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracoes_mes (
  id SERIAL PRIMARY KEY,
  mes INT NOT NULL,
  ano INT NOT NULL,
  valor_almoco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  UNIQUE (mes, ano)
);

CREATE TABLE IF NOT EXISTS presencas (
  id SERIAL PRIMARY KEY,
  pessoa_id INT NOT NULL,
  data DATE NOT NULL,
  almocou BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pessoa FOREIGN KEY (pessoa_id) REFERENCES pessoas(id) ON DELETE CASCADE,
  CONSTRAINT unique_pessoa_data UNIQUE (pessoa_id, data)
);

CREATE INDEX IF NOT EXISTS idx_presencas_data ON presencas(data);
CREATE INDEX IF NOT EXISTS idx_presencas_pessoa ON presencas(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_config_mes_ano ON configuracoes_mes(mes, ano);
