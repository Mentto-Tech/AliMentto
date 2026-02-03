from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from datetime import date
from typing import List
import json
from sqlalchemy import text
from datetime import datetime
import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AliMentto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ali-mentto.vercel.app", "https://ali.mentto.com.br", "http://localhost:5173"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# PESSOAS
@app.get("/pessoas", response_model=List[models.PessoaResponse])
def listar_pessoas(ativo: bool = None, db: Session = Depends(get_db)):
    query = db.query(models.Pessoa)
    if ativo is not None:
        query = query.filter(models.Pessoa.ativo == ativo)
    return query.all()

@app.post("/pessoas", response_model=models.PessoaResponse)
def criar_pessoa(pessoa: models.PessoaCreate, db: Session = Depends(get_db)):
    db_pessoa = models.Pessoa(**pessoa.dict())
    db.add(db_pessoa)
    db.commit()
    db.refresh(db_pessoa)
    return db_pessoa

@app.put("/pessoas/{pessoa_id}", response_model=models.PessoaResponse)
def atualizar_pessoa(pessoa_id: int, ativo: bool, db: Session = Depends(get_db)):
    pessoa = db.query(models.Pessoa).filter(models.Pessoa.id == pessoa_id).first()
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    pessoa.ativo = ativo
    db.commit()
    db.refresh(pessoa)
    return pessoa

@app.patch("/pessoas/{pessoa_id}/nome", response_model=models.PessoaResponse)
def atualizar_nome_pessoa(pessoa_id: int, nome: str, db: Session = Depends(get_db)):
    pessoa = db.query(models.Pessoa).filter(models.Pessoa.id == pessoa_id).first()
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    pessoa.nome = nome
    db.commit()
    db.refresh(pessoa)
    return pessoa

@app.delete("/pessoas/{pessoa_id}")
def deletar_pessoa(pessoa_id: int, db: Session = Depends(get_db)):
    pessoa = db.query(models.Pessoa).filter(models.Pessoa.id == pessoa_id).first()
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada")
    db.delete(pessoa)
    db.commit()
    return {"message": "Pessoa deletada com sucesso"}

# CONFIGURAÇÕES
@app.get("/configuracoes/{mes}/{ano}", response_model=models.ConfiguracaoMesResponse)
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

@app.put("/configuracoes/{mes}/{ano}", response_model=models.ConfiguracaoMesResponse)
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

@app.get("/configuracoes", response_model=List[models.ConfiguracaoMesResponse])
def listar_configuracoes(db: Session = Depends(get_db)):
    configs = db.query(models.ConfiguracaoMes).order_by(
        models.ConfiguracaoMes.ano.desc(),
        models.ConfiguracaoMes.mes.desc()
    ).all()
    return configs

@app.delete("/configuracoes/{config_id}")
def deletar_configuracao(config_id: int, db: Session = Depends(get_db)):
    config = db.query(models.ConfiguracaoMes).filter(models.ConfiguracaoMes.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    db.delete(config)
    db.commit()
    return {"message": "Configuração deletada com sucesso"}

# PRESENÇAS
@app.get("/presencas/{data_str}", response_model=List[models.PresencaDiaResponse])
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

@app.post("/presencas", response_model=models.PresencaResponse)
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

@app.put("/presencas/{pessoa_id}/{data_str}", response_model=models.PresencaResponse)
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
@app.get("/resumo/{mes}/{ano}", response_model=models.ResumoMesResponse)
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

@app.get("/resumo-pessoas/{mes}/{ano}", response_model=List[models.ResumoPessoaResponse])
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

@app.get("/dias-com-presenca/{mes}/{ano}")
def dias_com_presenca(mes: int, ano: int, db: Session = Depends(get_db)):
    dias = db.query(
        func.distinct(extract('day', models.Presenca.data)).label('dia')
    ).filter(
        extract('month', models.Presenca.data) == mes,
        extract('year', models.Presenca.data) == ano,
        models.Presenca.almocou == True
    ).all()
    
    return [int(d.dia) for d in dias]

@app.get("/")
def root():
    return {"message": "AliMentto API"}


# Export entire database as JSON
@app.get("/export")
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


# Import entire DB from JSON file (multipart form upload)
@app.post("/import")
def import_db(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = file.file.read()
    try:
        data = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    try:
        # Truncate and reset identities
        db.execute(text("TRUNCATE TABLE presencas, pessoas, configuracoes_mes RESTART IDENTITY CASCADE;"))

        # Insert pessoas (preserve ids)
        for p in data.get("pessoas", []):
            pessoa = models.Pessoa(id=p.get("id"), nome=p.get("nome"), ativo=p.get("ativo", True))
            db.add(pessoa)

        # Insert configuracoes
        for c in data.get("configuracoes_mes", []):
            cfg = models.ConfiguracaoMes(id=c.get("id"), mes=c.get("mes"), ano=c.get("ano"), valor_almoco=c.get("valor_almoco", 0.0))
            db.add(cfg)

        db.commit()

        # Insert presencas (dates)
        for pr in data.get("presencas", []):
            data_str = pr.get("data")
            dt = datetime.fromisoformat(data_str).date() if data_str else None
            pres = models.Presenca(id=pr.get("id"), pessoa_id=pr.get("pessoa_id"), data=dt, almocou=pr.get("almocou", False))
            db.add(pres)

        db.commit()

        # Ensure sequences are set to max(id)
        db.execute(text("SELECT setval(pg_get_serial_sequence('pessoas','id'), COALESCE((SELECT MAX(id) FROM pessoas), 1), true);"))
        db.execute(text("SELECT setval(pg_get_serial_sequence('configuracoes_mes','id'), COALESCE((SELECT MAX(id) FROM configuracoes_mes), 1), true);"))
        db.execute(text("SELECT setval(pg_get_serial_sequence('presencas','id'), COALESCE((SELECT MAX(id) FROM presencas), 1), true);"))
        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")

    return {"message": "Import successful"}
