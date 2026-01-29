import { FaChartLine } from 'react-icons/fa';
import './ResumoMes.css';
import { useState, useEffect } from 'react';

function ResumoMes({ selectedDate, refreshTrigger }) {
    
    const [resumo, setResumo] = useState({ total_almocos: 0, valor_total: 0 });
    const [pessoas, setPessoas] = useState([]);

    useEffect(() => {
        const mes = selectedDate.getMonth() + 1;
        const ano = selectedDate.getFullYear();

        // Buscar resumo total
        fetch(`http://localhost:8000/resumo/${mes}/${ano}`)
            .then(response => response.json())
            .then(data => setResumo(data))
            .catch(error => console.error('Erro ao buscar resumo:', error));

        // Buscar resumo por pessoa
        fetch(`http://localhost:8000/resumo-pessoas/${mes}/${ano}`)
            .then(response => response.json())
            .then(data => setPessoas(data))
            .catch(error => console.error('Erro ao buscar resumo por pessoa:', error));
    }, [selectedDate, refreshTrigger]);

    return (
        <div className='resumoMes'>
            <div className='resumo-header'>
                <FaChartLine className='iconeResumo' />
                <strong>Resumo do Mês</strong>
            </div>

            <div className='dados'>
                <div className='totalAlmoco'>
                    <p>Total de Almoços</p>
                    <span className='valor-almoco'>{resumo.total_almocos}</span>
                </div>

                <div className='valorTotal'>
                    <p>Valor Total</p>
                    <span className='valor-total'>R$ {resumo.valor_total.toFixed(2)}</span>
                </div>
            </div>

            <div className='listaPorPessoa'>
                <p className='tituloPorPessoa'>Por pessoa:</p>
                <div className='scrollContainer'>
                    {pessoas.map((pessoa, index) => (
                        <div key={index} className='itemPessoaResumo'>
                            <span className='nomePessoaResumo'>{pessoa.nome}</span>
                            <span className='almocoPessoa'>{pessoa.total_almocos} almoços</span>
                            <span className='valorPessoa'>R$ {pessoa.valor_total.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ResumoMes;