CREATE DATABASE IF NOT EXISTS alimentto;
USE alimentto;

CREATE TABLE IF NOT EXISTS pessoas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracoes_mes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mes INT NOT NULL,
  ano INT NOT NULL,
  valor_almoco DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  UNIQUE KEY mes_ano (mes, ano)
);

CREATE TABLE IF NOT EXISTS presencas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pessoa_id INT NOT NULL,
  data DATE NOT NULL,
  almocou BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pessoa_id) REFERENCES pessoas(id) ON DELETE CASCADE,
  UNIQUE KEY pessoa_data (pessoa_id, data)
);

CREATE INDEX idx_presencas_data ON presencas(data);
CREATE INDEX idx_presencas_pessoa ON presencas(pessoa_id);
CREATE INDEX idx_config_mes_ano ON configuracoes_mes(mes, ano);
