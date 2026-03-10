-- Seeds for PostgreSQL
-- This script runs against the database defined by POSTGRES_DB in docker-compose / container env.

TRUNCATE TABLE presencas, pessoas, configuracoes_mes RESTART IDENTITY CASCADE;

INSERT INTO pessoas (nome, ativo) VALUES
('Luis', TRUE),
('Victor', TRUE),
('Tiago', TRUE),
('Hugo', TRUE),
('Chris', TRUE),
('Sarah', TRUE),
('Fernanda', TRUE),
('Isabelly', TRUE),
('Luana', TRUE);


INSERT INTO configuracoes_mes (mes, ano, valor_almoco) VALUES
(1, 2026, 13.60);

INSERT INTO usuarios (username, senha_hash) VALUES
('admin', '$2b$12$SmQUCy8jCy1dH/o4yKrbgOdzN1HYS7D8yb2UIFJAdOvvCFYqRPoCW');