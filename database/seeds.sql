-- Seeds for PostgreSQL
-- This script runs against the database defined by POSTGRES_DB in docker-compose / container env.

-- Limpar dados existentes e reiniciar identities
TRUNCATE TABLE presencas, pessoas, configuracoes_mes RESTART IDENTITY CASCADE;

-- Inserir pessoas
INSERT INTO pessoas (nome, ativo) VALUES
('Luis', TRUE),
('Victor', TRUE),
('Tiago', TRUE),
('Hugo', TRUE),
('Chris', TRUE),
('Sara', TRUE),
('Fernanda', TRUE),
('Isabelly', TRUE),
('Luana', TRUE);


-- Configuração de valores mensais (Janeiro 2026)
INSERT INTO configuracoes_mes (mes, ano, valor_almoco) VALUES
(1, 2026, 13.60);