USE alimentto;

-- Limpar dados existentes
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE presencas;
TRUNCATE TABLE pessoas;
TRUNCATE TABLE configuracoes_mes;
SET FOREIGN_KEY_CHECKS = 1;

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
(1, 2026, 13.60),