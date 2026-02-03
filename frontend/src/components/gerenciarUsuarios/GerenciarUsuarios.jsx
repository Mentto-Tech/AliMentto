import { useState, useEffect } from 'react';
import { FaTimes, FaUserPlus, FaTrash, FaEdit, FaCheck, FaTrashAlt } from 'react-icons/fa';
import './GerenciarUsuarios.css';
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function GerenciarUsuarios({ isOpen, onClose, onUpdate }) {
  const [pessoas, setPessoas] = useState([]);
  const [nome, setNome] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [nomeEditando, setNomeEditando] = useState('');

  const carregarPessoas = () => {
    fetch(`${API}/pessoas`)
      .then(response => response.json())
      .then(data => setPessoas(data))
      .catch(error => console.error('Erro ao buscar pessoas:', error));
  };

  useEffect(() => {
    if (isOpen) {
      carregarPessoas();
    }
  }, [isOpen]);

  const adicionarPessoa = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    await fetch(`${API}/pessoas`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim(), ativo: true })
    });

    setNome('');
    carregarPessoas();
    if (onUpdate) onUpdate();
  };

  const toggleAtivo = async (id, ativoAtual) => {
    await fetch(`${API}/pessoas/${id}?ativo=${!ativoAtual}`, {
      method: 'PUT'
    });
    carregarPessoas();
    if (onUpdate) onUpdate();
  };

  const iniciarEdicao = (pessoa) => {
    setEditandoId(pessoa.id);
    setNomeEditando(pessoa.nome);
  };

  const salvarEdicao = async (id) => {
    if (!nomeEditando.trim()) return;

    await fetch(`${API}/pessoas/${id}/nome?nome=${encodeURIComponent(nomeEditando.trim())}`, {
      method: 'PATCH'
    });

    setEditandoId(null);
    setNomeEditando('');
    carregarPessoas();
    if (onUpdate) onUpdate();
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setNomeEditando('');
  };

  const deletarPessoa = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja DELETAR PERMANENTEMENTE o usuário "${nome}"?\n\nEsta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      await fetch(`${API}/pessoas/${id}`, {
        method: 'DELETE'
      });
      carregarPessoas();
      if (onUpdate) onUpdate();
      alert('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar pessoa:', error);
      alert('Erro ao deletar usuário!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gerenciar Usuários</h2>
          <button className="btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={adicionarPessoa} className="form-adicionar">
            <input
              type="text"
              placeholder="Nome do novo usuário"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <button type="submit" className="btn-adicionar">
              <FaUserPlus /> Adicionar
            </button>
          </form>

          <div className="lista-usuarios">
            {pessoas.map(pessoa => (
              <div key={pessoa.id} className={`usuario-item ${!pessoa.ativo ? 'inativo' : ''}`}>
                {editandoId === pessoa.id ? (
                  <>
                    <input
                      type="text"
                      value={nomeEditando}
                      onChange={(e) => setNomeEditando(e.target.value)}
                      className="input-editar"
                    />
                    <div className="acoes">
                      <button className="btn-salvar" onClick={() => salvarEdicao(pessoa.id)}>
                        <FaCheck />
                      </button>
                      <button className="btn-cancelar" onClick={cancelarEdicao}>
                        <FaTimes />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="nome-usuario">{pessoa.nome}</span>
                    <span className={`status ${pessoa.ativo ? 'ativo' : 'inativo'}`}>
                      {pessoa.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <div className="acoes">
                      <button className="btn-editar" onClick={() => iniciarEdicao(pessoa)}>
                        <FaEdit />
                      </button>
                      <button 
                        className={pessoa.ativo ? "btn-desativar" : "btn-ativar"}
                        onClick={() => toggleAtivo(pessoa.id, pessoa.ativo)}
                        title={pessoa.ativo ? "Desativar" : "Ativar"}
                      >
                        {pessoa.ativo ? <FaTrash /> : <FaCheck />}
                      </button>
                      <button 
                        className="btn-deletar-permanente"
                        onClick={() => deletarPessoa(pessoa.id, pessoa.nome)}
                        title="Deletar permanentemente"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GerenciarUsuarios;
