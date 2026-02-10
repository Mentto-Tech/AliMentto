import { useEffect, useState } from 'react';
import { FaUserPlus, FaTrash, FaUsers, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import pessoaIcone from '../../assets/pessoaIcone.png';
import './Presenca.css';
import { useApi } from '../../context/ApiContext'

function Presenca ({ selectedDate, onPresencaUpdate }) {

    const [presencas, setPresencas] = useState([]);
    const [nome, setNome] = useState('');
    const [sortOrder, setSortOrder] = useState(null); // null = sem ordenação, 'desc' = mais para menos, 'asc' = menos para mais
    const [resumoMensal, setResumoMensal] = useState([]);
    const { request } = useApi()

    const carregarPresencas = () => {
        const dateStr = formatDateISO(selectedDate);
        request(`/presencas/${dateStr}`)
          .then(res => res.json())
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

    const carregarResumoMensal = () => {
        const mes = selectedDate.getMonth() + 1;
        const ano = selectedDate.getFullYear();
        request(`/resumo-pessoas/${mes}/${ano}`)
          .then(res => res.json())
          .then(data => setResumoMensal(data))
          .catch(error => console.error('Erro ao buscar resumo mensal:', error));
    };

    useEffect(() => {
      const dateStr = formatDateISO(selectedDate);
      request(`/presencas/${dateStr}`)
        .then(response => response.json())
        .then(data => setPresencas(data))
        .catch(error => console.error('Erro ao buscar presenças:', error));
      
      carregarResumoMensal();
    }, [selectedDate]);

    const toggleSort = () => {
        if (sortOrder === null) {
            setSortOrder('desc');
        } else if (sortOrder === 'desc') {
            setSortOrder('asc');
        } else {
            setSortOrder(null);
        }
    };

    const getPresencasOrdenadas = () => {
        if (sortOrder === null) {
            return presencas;
        }

        const resumoMap = {};
        resumoMensal.forEach(r => {
            resumoMap[r.nome] = r.total_almocos;
        });

        return [...presencas].sort((a, b) => {
            const totalA = resumoMap[a.nome] || 0;
            const totalB = resumoMap[b.nome] || 0;
            return sortOrder === 'desc' ? totalB - totalA : totalA - totalB;
        });
    };

    async function adicionarPessoa(e) {
      e.preventDefault();

      await request('/pessoas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, ativo: true })
      });

      setNome('');
      carregarPresencas();
    }

    async function deletarUsuario(id) {
      const confirm = window.confirm("Tem certeza que deseja desativar este usuário?");

      if (!confirm) return;

        await request(`/pessoas/${id}?ativo=false`, { method: 'PUT' })
      
      carregarPresencas();
    }

    async function togglePresenca(pessoaId, almocou) {
        const dateStr = formatDateISO(selectedDate);
        await request('/presencas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pessoa_id: pessoaId, data: dateStr, almocou: !almocou })
        })
        
        carregarPresencas();
        if (onPresencaUpdate) {
            onPresencaUpdate();
        }
    }

    const presencasOrdenadas = getPresencasOrdenadas();
    const resumoMap = {};
    resumoMensal.forEach(r => {
        resumoMap[r.nome] = r.total_almocos;
    });

    return (
        <div className='main'>
          <div className='presenca-header'>
            <FaUsers className='iconePresenca' size={20}/>
            <strong>Presença - {formatDate(selectedDate)}</strong>
            <button 
              className={`btnSort ${sortOrder ? 'active' : ''}`} 
              onClick={toggleSort}
              title={sortOrder === 'desc' ? 'Ordenar: menos para mais' : sortOrder === 'asc' ? 'Remover ordenação' : 'Ordenar: mais para menos'}
            >
              {sortOrder === 'asc' ? <FaSortAmountUp size={16} /> : <FaSortAmountDown size={16} />}
              {sortOrder && <span className='sortLabel'>{sortOrder === 'desc' ? 'Mais' : 'Menos'}</span>}
            </button>
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
            {presencasOrdenadas.map(pessoa => (
                <div key={pessoa.id} className='itemPessoa'>
                    <img src={pessoaIcone} alt={pessoa.nome} className='fotoPessoa'/>
                    <span className='nomePessoa'>{pessoa.nome}</span>
                    {sortOrder && <span className='badgeMensal' title='Almoços no mês'>{resumoMap[pessoa.nome] || 0}x</span>}
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