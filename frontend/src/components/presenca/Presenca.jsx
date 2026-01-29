import { useEffect, useState } from 'react';
import { FaUserPlus, FaTrash, FaUsers } from 'react-icons/fa';
import pessoaIcone from '../../assets/pessoaIcone.png';
import './Presenca.css';

function Presenca ({ selectedDate, onPresencaUpdate }) {

    const [presencas, setPresencas] = useState([]);
    const [nome, setNome] = useState('');

    const carregarPresencas = () => {
        const dateStr = formatDateISO(selectedDate);
        fetch(`http://localhost:8000/presencas/${dateStr}`)
            .then(response => response.json())
            .then(data => setPresencas(data))
            .catch(error => console.error('Erro ao buscar presenças:', error));
    };

    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateISO = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const dateStr = formatDateISO(selectedDate);
        fetch(`http://localhost:8000/presencas/${dateStr}`)
            .then(response => response.json())
            .then(data => setPresencas(data))
            .catch(error => console.error('Erro ao buscar presenças:', error));
    }, [selectedDate]);

    async function adicionarPessoa(e) {
      e.preventDefault();

      await fetch('http://localhost:8000/pessoas', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            nome,
            ativo: true 
          })
      });

      setNome('');
      carregarPresencas();
    }

    async function deletarUsuario(id) {
      const confirm = window.confirm("Tem certeza que deseja desativar este usuário?");

      if (!confirm) return;

      await fetch(`http://localhost:8000/pessoas/${id}?ativo=false`, {
          method: 'PUT'
      });
      
      carregarPresencas();
    }

    async function togglePresenca(pessoaId, almocou) {
        const dateStr = formatDateISO(selectedDate);
        
        await fetch('http://localhost:8000/presencas', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                pessoa_id: pessoaId,
                data: dateStr,
                almocou: !almocou
            })
        });
        
        carregarPresencas();
        if (onPresencaUpdate) {
            onPresencaUpdate();
        }
    }

    return (
        <div className='main'>
          <div className='presenca-header'>
            <FaUsers className='iconePresenca' size={20}/>
            <strong>Presença - {formatDate(selectedDate)}</strong>
          </div>

          <div className='adicionarUsuario'>
            <form onSubmit={adicionarPessoa} className='pesquisa'>
              <input 
                className='inputPesquisa' 
                type="text" 
                placeholder='Nome da pessoa...'
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <button className='btnAdicionar' type="submit">
                <FaUserPlus size={18} />
                Adicionar
              </button>
            </form>
          </div>

          <div className='listaPessoas'>
            {presencas.map(pessoa => (
                <div key={pessoa.id} className='itemPessoa'>
                    <img src={pessoaIcone} alt={pessoa.nome} className='fotoPessoa'/>
                    <span className='nomePessoa'>{pessoa.nome}</span>
                    <span className='labelPresenca'>{pessoa.almocou ? 'Almoçou' : 'Não almoçou'}</span>
                    
                    <label className='toggle-switch'>
                      <input 
                        type="checkbox" 
                        className='checkboxPresenca'
                        checked={pessoa.almocou}
                        onChange={() => togglePresenca(pessoa.id, pessoa.almocou)}
                      />
                      <span className='slider'></span>
                    </label>
                    
                    <button className='btnExcluir' onClick={() => deletarUsuario(pessoa.id)}>
                      <FaTrash size={18} />
                    </button>
                </div>
            ))}
          </div>
        </div>
    )
}

export default Presenca;