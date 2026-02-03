# AliMentto - Sistema de Controle de Almoços

Sistema completo para gerenciar a presença e controle de almoços da equipe.

## 🚀 Tecnologias

- **Frontend**: React + Vite
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **Deploy**: Docker + Docker Compose

## 📋 Pré-requisitos

- Docker
- Docker Compose

## 🔧 Instalação e Execução

### 1. Clone o repositório e entre na pasta
```bash
cd alimentto
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

**IMPORTANTE**: Edite o arquivo `.env` e altere as senhas padrão:
- `POSTGRES_PASSWORD`: Senha do usuário Postgres
- `DATABASE_URL`: Atualizar com a connection string do Postgres

⚠️ **Nunca commite o arquivo `.env` no git!** Ele contém informações sensíveis.

### 3. Inicie os containers
```bash
docker-compose up -d
```

### 4. Acesse a aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

## 📁 Estrutura do Projeto

```
alimentto/
├── backend/           # API FastAPI
│   ├── main.py       # Rotas da API
│   ├── models.py     # Models e Schemas
│   ├── database.py   # Configuração do BD
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # React App
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── database/         # Scripts SQL
│   ├── create.sql   # Estrutura das tabelas
│   ├── seeds.sql    # Dados iniciais
│   └── README.md
└── docker-compose.yml
```

## 🔌 API Endpoints

### Pessoas
- `GET /pessoas` - Lista todas as pessoas
- `POST /pessoas` - Cria nova pessoa
- `DELETE /pessoas/{id}` - Remove pessoa

### Configurações
- `GET /configuracoes/{mes}/{ano}` - Obtém config do mês
- `PUT /configuracoes/{mes}/{ano}?valor=15.00` - Atualiza valor

### Presenças
- `GET /presencas/{data}` - Lista presenças do dia (YYYY-MM-DD)
- `POST /presencas` - Registra presença
- `PUT /presencas/{pessoa_id}/{data}` - Atualiza presença

### Resumos
- `GET /resumo/{mes}/{ano}` - Total geral do mês
- `GET /resumo-pessoas/{mes}/{ano}` - Total por pessoa

## 🛠️ Comandos Úteis

### Ver logs
```bash
docker-compose logs -f
```

### Parar os containers
```bash
docker-compose down
```

### Reconstruir os containers
```bash
docker-compose up -d --build
```

### Acessar o banco de dados
```bash
docker exec -it alimentto-db psql -U postgres -d alimentto
```

### Resetar banco de dados
```bash
docker-compose down -v
docker-compose up -d
```

## 📝 Desenvolvimento Local (sem Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🐛 Troubleshooting

- **Erro de conexão com banco**: Aguarde alguns segundos para o MySQL inicializar completamente
- **Porta em uso**: Altere as portas no `docker-compose.yml`
- **Problemas com volume**: Execute `docker-compose down -v` para limpar volumes

## 📄 Licença

Projeto desenvolvido para uso interno.
