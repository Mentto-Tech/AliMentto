import { useEffect, useState } from 'react';
import './ConfiguracaoMes.css';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function ConfiguracaoMes({ selectedDate }) {

  const mes = selectedDate.getMonth() + 1;
  const ano = selectedDate.getFullYear();
  const mesNome = monthNames[selectedDate.getMonth()];
  
  const [valor, setValor] = useState('');

  const carregarConfiguracao = () => {
    fetch(`http://localhost:8000/configuracoes/${mes}/${ano}`)
      .then(response => response.json())
      .then(data => setValor(data.valor_almoco))
      .catch(error => console.error('Erro ao buscar configuração:', error));
  };

  useEffect(() => {
    carregarConfiguracao();
  }, [mes, ano]);

  async function salvarConfiguracao(e) {
    e.preventDefault();

    await fetch(`http://localhost:8000/configuracoes/${mes}/${ano}?valor=${valor}`, {
      method: 'PUT'
    });

    alert('Configuração salva com sucesso!');
    carregarConfiguracao();
  }

  return (
    <div className="configuracaoMes">
      <strong>Configuração - {mesNome} de {ano}</strong>

      <p>Valor da ficha de almoço (R$)</p>

      <form onSubmit={salvarConfiguracao} className='valorInput'>
        <input 
          type="number" 
          placeholder='0.00'
          step="0.01"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />

        <button className='btnSalvar' type="submit">
          Salvar
        </button>
      </form>
    </div>
  );
}

export default ConfiguracaoMes;