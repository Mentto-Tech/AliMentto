import { useState } from 'react'
import './App.css'
import logo from './assets/logo.png'
import Calendario from './components/calendario/Calendario'
import Presenca from './components/presenca/Presenca'
import ConfiguracaoMes from './components/configuracaoMes/ConfiguracaoMes'
import ResumoMes from './components/resumoMes/ResumoMes'
import GerenciarUsuarios from './components/gerenciarUsuarios/GerenciarUsuarios'
import HistoricoConfiguracoes from './components/historicoConfiguracoes/HistoricoConfiguracoes'
import { FaUsers, FaHistory } from 'react-icons/fa'

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshResumo, setRefreshResumo] = useState(0);
  const [modalUsuarios, setModalUsuarios] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);

  const triggerRefreshResumo = () => setRefreshResumo(prev => prev + 1);

  return (
    <>
      <header className='header'>
        <img className='logo' src={logo} alt="AliMentto logo"/>
        <div className='textosHeader'>
          <strong>AliMentto</strong>
          <p>Controle de Almoços</p>
        </div>
      </header>

      <div className="App">
        <div className='div1'>            
          <Calendario selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>
          
          <ConfiguracaoMes selectedDate={selectedDate}/>
        </div>

        <div className='div2'>
          <Presenca selectedDate={selectedDate} onPresencaUpdate={triggerRefreshResumo}/>
          
          <div className='botoes-gerenciamento'>
            <button className='btn-gerenciar' onClick={() => setModalUsuarios(true)}>
              <FaUsers /> Gerenciar Usuários
            </button>
            <button className='btn-gerenciar' onClick={() => setModalHistorico(true)}>
              <FaHistory /> Histórico de Valores
            </button>
          </div>
        </div>

        <div className='div3'>
          <ResumoMes selectedDate={selectedDate} refreshTrigger={refreshResumo}/>
        </div>
      </div>

      <GerenciarUsuarios 
        isOpen={modalUsuarios} 
        onClose={() => setModalUsuarios(false)}
        onUpdate={triggerRefreshResumo}
      />
      
      <HistoricoConfiguracoes 
        isOpen={modalHistorico} 
        onClose={() => setModalHistorico(false)}
        onUpdate={triggerRefreshResumo}
      />
    </>
  )
}

export default App
