from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from datetime import date, datetime, timedelta
from typing import List
import json
import os
from sqlalchemy import text
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

# ── Auth config ────────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
http_bearer = HTTPBearer()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db),
):
    exc = HTTPException(
        status_code=401,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise exc
    except JWTError:
        raise exc
    usuario = db.query(models.Usuario).filter(models.Usuario.username == username).first()
    if usuario is None:
        raise exc
    return usuario


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="AliMentto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ali-mentto.vercel.app", "https://ali.mentto.com.br", "http://localhost:5173"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup: criar usuário admin se não existir ────────────────────────────────

@app.on_event("startup")
def create_default_admin():
    """
    Cria automaticamente o usuário admin padrão se não existir nenhum usuário no banco.
    Senha padrão: admin123 (DEVE SER ALTERADA após o primeiro login!)
    """
    db = next(get_db())
    try:
        # Verifica se já existe algum usuário
        usuario_count = db.query(models.Usuario).count()
        
        if usuario_count == 0:
            # Credenciais padrão (ALTERE APÓS O PRIMEIRO LOGIN!)
            default_username = "admin"
            default_password = "admin123"
            
            # Gera hash da senha
            salt = bcrypt.gensalt()
            senha_hash = bcrypt.hashpw(default_password.encode('utf-8'), salt).decode('utf-8')
            
            # Cria o usuário admin
            novo_usuario = models.Usuario(
                username=default_username,
                senha_hash=senha_hash
            )
            db.add(novo_usuario)
            db.commit()
            
            print("=" * 60)
            print("USUÁRIO ADMIN CRIADO COM SUCESSO!")
            print(f"Username: {default_username}")
            print(f"Senha: {default_password}")
            print("⚠️  IMPORTANTE: Altere esta senha após o primeiro login!")
            print("=" * 60)
    except Exception as e:
        print(f"Erro ao criar usuário admin: {e}")
        db.rollback()
    finally:
        db.close()


# ── Public routes ──────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "AliMentto API"}


@app.post("/auth/login", response_model=models.TokenResponse)
def login(body: models.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.username == body.username).first()
    if not usuario or not pwd_context.verify(body.password, usuario.senha_hash):
        raise HTTPException(
            status_code=401,
            detail="Usuário ou senha inválidos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": usuario.username})
    return {"access_token": token, "token_type": "bearer"}


# ── Protected routes (require valid JWT) ──────────────────────────────────────

router = APIRouter(dependencies=[Depends(get_current_user)])

# AUTH
@router.post("/auth/alterar-senha")
def alterar_senha(
    body: models.AlterarSenhaRequest,
    current_user: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permite ao usuário logado alterar sua própria senha."""
    # Verifica se a senha atual está correta
    if not pwd_context.verify(body.senha_atual, current_user.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    
    # Gera hash da nova senha
    salt = bcrypt.gensalt()
    nova_senha_hash = bcrypt.hashpw(body.senha_nova.encode('utf-8'), salt).decode('utf-8')
    
    # Atualiza a senha
    current_user.senha_hash = nova_senha_hash
    db.commit()
    
    return {"message": "Senha alterada com sucesso"}


# PESSOAS
@router.get("/pessoas", response_model=List[models.PessoaResponse])
def listar_pessoas(ativo: bool = None, db: Session = Depends(get_db)):
    query = db.query(models.Pessoa)
    if ativo is not None:
        query = query.filter(models.Pessoa.ativo == ativo)
    return query.all()

@router.post("/pessoas", response_model=models.PessoaResponse)
def criar_pessoa(pessoa: models.PessoaCreate, db: Session = Depends(get_db)):
    db_pessoa = models.Pessoa(**pessoa.dict())
    db.add(db_pessoa)
    db.commit()
    db.refresh(db_pessoa)
    return db_pessoa

@router.put("/pessoas/{pessoa_id}", response_model=models.PessoaResponse)
def atualizar_pessoa(pessoa_id: int, ativo: bool, db: Session = Depends(get_db)):
    pessoa = db.query(models.Pessoa).filter(models.Pessoa.id == pessoa_id).first()
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    pessoa.ativo = ativo
    db.commit()
    db.refresh(pessoa)
    return pessoa

@router.patch("/pessoas/{pessoa_id}/nome", response_model=models.PessoaResponse)
def atualizar_nome_pessoa(pessoa_id: int, nome: str, db: Session = Depends(get_db)):
    pessoa = db.query(models.Pessoa).filter(models.Pessoa.id == pessoa_id).first()
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    pessoa.nome = nome
    db.commit()
    db.refresh(pessoa)
    return pessoa

@router.delete("/pessoas/{pessoa_id}")
def deletar_pessoa(pessoa_id: int, db: Session = Depends(get_db)):
    pessoa = db.query(models.Pessoa).filter(models.Pessoa.id == pessoa_id).first()
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    db.delete(pessoa)
    db.commit()
    return {"message": "Pessoa deletada com sucesso"}

# CONFIGURAÇÕES
@router.get("/configuracoes/{mes}/{ano}", response_model=models.ConfiguracaoMesResponse)
def obter_configuracao(mes: int, ano: int, db: Session = Depends(get_db)):
    config = db.query(models.ConfiguracaoMes).filter(
        models.ConfiguracaoMes.mes == mes,
        models.ConfiguracaoMes.ano == ano
    ).first()
    
    if not config:
        config = models.ConfiguracaoMes(mes=mes, ano=ano, valor_almoco=0.00)
        db.add(config)
        db.commit()
        db.refresh(config)
    
    return config

@router.put("/configuracoes/{mes}/{ano}", response_model=models.ConfiguracaoMesResponse)
def atualizar_configuracao(mes: int, ano: int, valor: float, db: Session = Depends(get_db)):
    config = db.query(models.ConfiguracaoMes).filter(
        models.ConfiguracaoMes.mes == mes,
        models.ConfiguracaoMes.ano == ano
    ).first()
    
    if not config:
        config = models.ConfiguracaoMes(mes=mes, ano=ano, valor_almoco=valor)
        db.add(config)
    else:
        config.valor_almoco = valor
    
    db.commit()
    db.refresh(config)
    return config

@router.get("/configuracoes", response_model=List[models.ConfiguracaoMesResponse])
def listar_configuracoes(db: Session = Depends(get_db)):
    configs = db.query(models.ConfiguracaoMes).order_by(
        models.ConfiguracaoMes.ano.desc(),
        models.ConfiguracaoMes.mes.desc()
    ).all()
    return configs

@router.delete("/configuracoes/{config_id}")
def deletar_configuracao(config_id: int, db: Session = Depends(get_db)):
    config = db.query(models.ConfiguracaoMes).filter(models.ConfiguracaoMes.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    db.delete(config)
    db.commit()
    return {"message": "Configuração deletada com sucesso"}

# PRESENÇAS
@router.get("/presencas/{data_str}", response_model=List[models.PresencaDiaResponse])
def listar_presencas_dia(data_str: str, db: Session = Depends(get_db)):
    data_obj = date.fromisoformat(data_str)
    
    result = db.query(
        models.Pessoa.id,
        models.Pessoa.nome,
        func.coalesce(models.Presenca.almocou, False).label('almocou')
    ).outerjoin(
        models.Presenca,
        (models.Pessoa.id == models.Presenca.pessoa_id) & (models.Presenca.data == data_obj)
    ).filter(
        models.Pessoa.ativo == True
    ).order_by(models.Pessoa.nome).all()
    
    return [{"id": r.id, "nome": r.nome, "almocou": r.almocou} for r in result]

@router.post("/presencas", response_model=models.PresencaResponse)
def criar_presenca(presenca: models.PresencaCreate, db: Session = Depends(get_db)):
    db_presenca = db.query(models.Presenca).filter(
        models.Presenca.pessoa_id == presenca.pessoa_id,
        models.Presenca.data == presenca.data
    ).first()
    
    if db_presenca:
        db_presenca.almocou = presenca.almocou
    else:
        db_presenca = models.Presenca(**presenca.dict())
        db.add(db_presenca)
    
    db.commit()
    db.refresh(db_presenca)
    return db_presenca

@router.put("/presencas/{pessoa_id}/{data_str}", response_model=models.PresencaResponse)
def atualizar_presenca(pessoa_id: int, data_str: str, update: models.PresencaUpdate, db: Session = Depends(get_db)):
    data_obj = date.fromisoformat(data_str)
    
    presenca = db.query(models.Presenca).filter(
        models.Presenca.pessoa_id == pessoa_id,
        models.Presenca.data == data_obj
    ).first()
    
    if presenca:
        presenca.almocou = update.almocou
    else:
        presenca = models.Presenca(pessoa_id=pessoa_id, data=data_obj, almocou=update.almocou)
        db.add(presenca)
    
    db.commit()
    db.refresh(presenca)
    return presenca

# RESUMOS
@router.get("/resumo/{mes}/{ano}", response_model=models.ResumoMesResponse)
def resumo_mes(mes: int, ano: int, db: Session = Depends(get_db)):
    config = db.query(models.ConfiguracaoMes).filter(
        models.ConfiguracaoMes.mes == mes,
        models.ConfiguracaoMes.ano == ano
    ).first()
    
    valor_almoco = float(config.valor_almoco) if config else 0.00
    
    total = db.query(func.count(models.Presenca.id)).filter(
        extract('month', models.Presenca.data) == mes,
        extract('year', models.Presenca.data) == ano,
        models.Presenca.almocou == True
    ).scalar() or 0
    
    return {
        "total_almocos": total,
        "valor_total": total * valor_almoco
    }

@router.get("/resumo-pessoas/{mes}/{ano}", response_model=List[models.ResumoPessoaResponse])
def resumo_pessoas(mes: int, ano: int, db: Session = Depends(get_db)):
    config = db.query(models.ConfiguracaoMes).filter(
        models.ConfiguracaoMes.mes == mes,
        models.ConfiguracaoMes.ano == ano
    ).first()
    
    valor_almoco = float(config.valor_almoco) if config else 0.00
    
    result = db.query(
        models.Pessoa.nome,
        func.count(case((models.Presenca.almocou == True, 1))).label('total_almocos')
    ).outerjoin(
        models.Presenca,
        (models.Pessoa.id == models.Presenca.pessoa_id) &
        (extract('month', models.Presenca.data) == mes) &
        (extract('year', models.Presenca.data) == ano)
    ).filter(
        models.Pessoa.ativo == True
    ).group_by(
        models.Pessoa.id, models.Pessoa.nome
    ).order_by(models.Pessoa.nome).all()
    
    return [
        {
            "nome": r.nome,
            "total_almocos": r.total_almocos,
            "valor_total": r.total_almocos * valor_almoco
        }
        for r in result
    ]

@router.get("/dias-com-presenca/{mes}/{ano}")
def dias_com_presenca(mes: int, ano: int, db: Session = Depends(get_db)):
    dias = db.query(
        func.distinct(extract('day', models.Presenca.data)).label('dia')
    ).filter(
        extract('month', models.Presenca.data) == mes,
        extract('year', models.Presenca.data) == ano,
        models.Presenca.almocou == True
    ).all()
    
    return [int(d.dia) for d in dias]

# BACKUP
@router.get("/export")
def export_db(db: Session = Depends(get_db)):
    pessoas = db.query(models.Pessoa).order_by(models.Pessoa.id).all()
    configuracoes = db.query(models.ConfiguracaoMes).order_by(models.ConfiguracaoMes.id).all()
    presencas = db.query(models.Presenca).order_by(models.Presenca.id).all()

    def pessoa_to_dict(p):
        return {"id": p.id, "nome": p.nome, "ativo": p.ativo, "criado_em": p.criado_em.isoformat() if p.criado_em else None}

    def config_to_dict(c):
        return {"id": c.id, "mes": c.mes, "ano": c.ano, "valor_almoco": float(c.valor_almoco)}

    def presenca_to_dict(pr):
        return {"id": pr.id, "pessoa_id": pr.pessoa_id, "data": pr.data.isoformat(), "almocou": pr.almocou, "criado_em": pr.criado_em.isoformat() if pr.criado_em else None}

    payload = {
        "pessoas": [pessoa_to_dict(p) for p in pessoas],
        "configuracoes_mes": [config_to_dict(c) for c in configuracoes],
        "presencas": [presenca_to_dict(pr) for pr in presencas]
    }

    return payload


@router.post("/import")
def import_db(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = file.file.read()
    try:
        data = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    try:
        db.execute(text("TRUNCATE TABLE presencas, pessoas, configuracoes_mes RESTART IDENTITY CASCADE;"))

        for p in data.get("pessoas", []):
            pessoa = models.Pessoa(id=p.get("id"), nome=p.get("nome"), ativo=p.get("ativo", True))
            db.add(pessoa)

        for c in data.get("configuracoes_mes", []):
            cfg = models.ConfiguracaoMes(id=c.get("id"), mes=c.get("mes"), ano=c.get("ano"), valor_almoco=c.get("valor_almoco", 0.0))
            db.add(cfg)

        db.commit()

        for pr in data.get("presencas", []):
            data_str = pr.get("data")
            dt = datetime.fromisoformat(data_str).date() if data_str else None
            pres = models.Presenca(id=pr.get("id"), pessoa_id=pr.get("pessoa_id"), data=dt, almocou=pr.get("almocou", False))
            db.add(pres)

        db.commit()

        db.execute(text("SELECT setval(pg_get_serial_sequence('pessoas','id'), COALESCE((SELECT MAX(id) FROM pessoas), 1), true);"))
        db.execute(text("SELECT setval(pg_get_serial_sequence('configuracoes_mes','id'), COALESCE((SELECT MAX(id) FROM configuracoes_mes), 1), true);"))
        db.execute(text("SELECT setval(pg_get_serial_sequence('presencas','id'), COALESCE((SELECT MAX(id) FROM presencas), 1), true);"))
        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")

    return {"message": "Import successful"}


app.include_router(router)
