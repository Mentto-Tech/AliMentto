import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import './AlterarSenha.css';

export default function AlterarSenha() {
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaNovaConfirm, setSenhaNovaConfirm] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    // Validações
    if (!senhaAtual || !senhaNova || !senhaNovaConfirm) {
      setErro('Preencha todos os campos');
      return;
    }

    if (senhaNova !== senhaNovaConfirm) {
      setErro('A nova senha e a confirmação não coincidem');
      return;
    }

    if (senhaNova.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/auth/alterar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senha_atual: senhaAtual,
          senha_nova: senhaNova
        })
      });

      if (response.ok) {
        setSucesso(true);
        setSenhaAtual('');
        setSenhaNova('');
        setSenhaNovaConfirm('');
        setTimeout(() => navigate('/'), 2000);
      } else {
        const data = await response.json();
        setErro(data.detail || 'Erro ao alterar senha');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alterar-senha-container">
      <div className="alterar-senha-card">
        <h2>Alterar Senha</h2>

        {erro && <div className="alert alert-error">{erro}</div>}
        {sucesso && (
          <div className="alert alert-success">
            Senha alterada com sucesso! Redirecionando...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="senha-atual">Senha Atual</label>
            <input
              type="password"
              id="senha-atual"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              disabled={loading || sucesso}
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha-nova">Nova Senha</label>
            <input
              type="password"
              id="senha-nova"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              disabled={loading || sucesso}
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha-nova-confirm">Confirmar Nova Senha</label>
            <input
              type="password"
              id="senha-nova-confirm"
              value={senhaNovaConfirm}
              onChange={(e) => setSenhaNovaConfirm(e.target.value)}
              disabled={loading || sucesso}
            />
          </div>

          <button 
            type="submit" 
            className="btn-alterar"
            disabled={loading || sucesso}
          >
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>

        <a href="/" className="btn-voltar" onClick={(e) => {
          e.preventDefault();
          navigate('/');
        }}>
          ← Voltar
        </a>
      </div>
    </div>
  );
}
