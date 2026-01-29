from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from datetime import date
from typing import List
import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AliMentto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/")
def root():
    return {"message": "AliMentto API"}
