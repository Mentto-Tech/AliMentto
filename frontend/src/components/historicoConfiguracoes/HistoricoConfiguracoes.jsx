import { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import './HistoricoConfiguracoes.css';
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function HistoricoConfiguracoes({ isOpen, onClose, onUpdate }) {
  const [configuracoes, setConfiguracoes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [valorEditando, setValorEditando] = useState('');

  const carregarConfiguracoes = async () => {
    try {
      const response = await fetch(`${API}/configuracoes`);
      const data = await response.json();
      setConfiguracoes(data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarConfiguracoes();
    }
  }, [isOpen]);

  const iniciarEdicao = (config) => {
    setEditandoId(config.id);
    setValorEditando(config.valor_almoco);
  };

  const salvarEdicao = async (mes, ano) => {
    if (!valorEditando || parseFloat(valorEditando) <= 0) return;

    await fetch(`${API}/configuracoes/${mes}/${ano}?valor=${valorEditando}`, {
      method: 'PUT'
    });

    setEditandoId(null);
    setValorEditando('');
    carregarConfiguracoes();
    if (onUpdate) onUpdate();
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setValorEditando('');
  };

  const deletarConfiguracao = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta configuração?')) return;

    await fetch(`${API}/configuracoes/${id}`, {
      method: 'DELETE'
    });

    carregarConfiguracoes();
    if (onUpdate) onUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-historico" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Histórico de Configurações</h2>
          <button className="btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="lista-configuracoes">
            {configuracoes.length === 0 ? (
              <p className="sem-dados">Nenhuma configuração encontrada</p>
            ) : (
              configuracoes.map(config => (
                <div key={config.id} className="config-item">
                  <div className="config-info">
                    <span className="config-mes">
                      {monthNames[config.mes - 1]} de {config.ano}
                    </span>
                    {editandoId === config.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={valorEditando}
                        onChange={(e) => setValorEditando(e.target.value)}
                        className="input-editar-valor"
                      />
                    ) : (
                      <span className="config-valor">
                        R$ {parseFloat(config.valor_almoco).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="config-acoes">
                    {editandoId === config.id ? (
                      <>
                        <button className="btn-salvar" onClick={() => salvarEdicao(config.mes, config.ano)}>
                          <FaCheck />
                        </button>
                        <button className="btn-cancelar" onClick={cancelarEdicao}>
                          <FaTimes />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-editar" onClick={() => iniciarEdicao(config)}>
                          <FaEdit />
                        </button>
                        <button className="btn-deletar" onClick={() => deletarConfiguracao(config.id)}>
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoricoConfiguracoes;
