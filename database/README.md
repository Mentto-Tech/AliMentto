# Database AliMentto

Sistema de controle de presenças para almoços da equipe.

## Estrutura

### Tabelas

#### `pessoas`
- `id`: Identificador único
- `nome`: Nome completo da pessoa
- `ativo`: Status ativo/inativo
- `criado_em`: Data de criação do registro

#### `configuracoes_mes`
- `id`: Identificador único
- `mes`: Mês (1-12)
- `ano`: Ano (YYYY)
- `valor_almoco`: Valor do almoço em reais

#### `presencas`
- `id`: Identificador único
- `pessoa_id`: Referência à pessoa
- `data`: Data da presença
- `almocou`: Se a pessoa almoçou (TRUE) ou não (FALSE)
- `criado_em`: Data de criação do registro

## Como usar

### 1. Criar o banco de dados e tabelas
```bash
mysql -u root -p < create.sql
```

### 2. Popular com dados iniciais
```bash
mysql -u root -p < seeds.sql
```

## Queries úteis

### Total de almoços por pessoa no mês
```sql
SELECT 
  p.nome,
  COUNT(CASE WHEN pr.almocou = TRUE THEN 1 END) as total_almocos,
  COALESCE(c.valor_almoco * COUNT(CASE WHEN pr.almocou = TRUE THEN 1 END), 0) as valor_total
FROM pessoas p
LEFT JOIN presencas pr ON p.id = pr.pessoa_id 
  AND MONTH(pr.data) = 1 
  AND YEAR(pr.data) = 2026
LEFT JOIN configuracoes_mes c ON c.mes = 1 AND c.ano = 2026
GROUP BY p.id, p.nome, c.valor_almoco
ORDER BY p.nome;
```

### Presença de um dia específico
```sql
SELECT p.nome, pr.almocou
FROM pessoas p
LEFT JOIN presencas pr ON p.id = pr.pessoa_id AND pr.data = '2026-01-29'
WHERE p.ativo = TRUE
ORDER BY p.nome;
```

### Total geral do mês
```sql
SELECT 
  COUNT(CASE WHEN almocou = TRUE THEN 1 END) as total_almocos,
  COALESCE(c.valor_almoco * COUNT(CASE WHEN almocou = TRUE THEN 1 END), 0) as valor_total
FROM presencas pr
CROSS JOIN configuracoes_mes c
WHERE MONTH(pr.data) = 1 
  AND YEAR(pr.data) = 2026
  AND c.mes = 1 
  AND c.ano = 2026;
```
