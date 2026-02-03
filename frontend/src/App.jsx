import { useState } from 'react'
import './App.css'
import logo from './assets/logo.png'
import Calendario from './components/calendario/Calendario'
import Presenca from './components/presenca/Presenca'
import ConfiguracaoMes from './components/configuracaoMes/ConfiguracaoMes'
import ResumoMes from './components/resumoMes/ResumoMes'
import GerenciarUsuarios from './components/gerenciarUsuarios/GerenciarUsuarios'
import HistoricoConfiguracoes from './components/historicoConfiguracoes/HistoricoConfiguracoes'
import BackupRestore from './components/backup/BackupRestore'
import { FaUsers, FaHistory } from 'react-icons/fa'
import { useContext } from 'react'
import { useApi } from './context/ApiContext'
import './globalLoader.css'

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshResumo, setRefreshResumo] = useState(0);
  const [modalUsuarios, setModalUsuarios] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);

  const triggerRefreshResumo = () => setRefreshResumo(prev => prev + 1);

  return (
    <>
      {/** Fullscreen loader when API provider indicates loading */}
      <FullScreenLoader />
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
          
          <ConfiguracaoMes selectedDate={selectedDate} onUpdate={triggerRefreshResumo} />
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
            <BackupRestore />
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

function FullScreenLoader(){
  const { loading } = useApi() || { loading: false }
  if(!loading) return null
  return (
    <div className="full-screen-loader">
      <div className="loader-box">Carregando dados...</div>
    </div>
  )
}
