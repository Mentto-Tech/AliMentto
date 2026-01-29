from sqlalchemy import Column, Integer, String, Boolean, Date, DECIMAL, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel
from datetime import date
from typing import Optional

# SQLAlchemy Models
class Pessoa(Base):
    __tablename__ = "pessoas"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    ativo = Column(Boolean, default=True)
    criado_em = Column(TIMESTAMP, server_default=func.now())
    
    presencas = relationship("Presenca", back_populates="pessoa", cascade="all, delete-orphan")

class ConfiguracaoMes(Base):
    __tablename__ = "configuracoes_mes"
    
    id = Column(Integer, primary_key=True, index=True)
    mes = Column(Integer, nullable=False)
    ano = Column(Integer, nullable=False)
    valor_almoco = Column(DECIMAL(10, 2), default=0.00)

class Presenca(Base):
    __tablename__ = "presencas"
    
    id = Column(Integer, primary_key=True, index=True)
    pessoa_id = Column(Integer, ForeignKey("pessoas.id", ondelete="CASCADE"), nullable=False)
    data = Column(Date, nullable=False)
    almocou = Column(Boolean, default=False)
    criado_em = Column(TIMESTAMP, server_default=func.now())
    
    pessoa = relationship("Pessoa", back_populates="presencas")

# Pydantic Schemas
class PessoaBase(BaseModel):
    nome: str
    ativo: bool = True

class PessoaCreate(PessoaBase):
    pass

class PessoaResponse(PessoaBase):
    id: int
    
    class Config:
        from_attributes = True

class ConfiguracaoMesBase(BaseModel):
    mes: int
    ano: int
    valor_almoco: float

class ConfiguracaoMesCreate(ConfiguracaoMesBase):
    pass

class ConfiguracaoMesResponse(ConfiguracaoMesBase):
    id: int
    
    class Config:
        from_attributes = True

class PresencaBase(BaseModel):
    pessoa_id: int
    data: date
    almocou: bool = False

class PresencaCreate(PresencaBase):
    pass

class PresencaUpdate(BaseModel):
    almocou: bool

class PresencaResponse(PresencaBase):
    id: int
    
    class Config:
        from_attributes = True

class PresencaDiaResponse(BaseModel):
    id: int
    nome: str
    almocou: bool
    
    class Config:
        from_attributes = True

class ResumoMesResponse(BaseModel):
    total_almocos: int
    valor_total: float

class ResumoPessoaResponse(BaseModel):
    nome: str
    total_almocos: int
    valor_total: float
