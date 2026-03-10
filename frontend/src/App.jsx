import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'
import logo from './assets/logo.png'
import Calendario from './components/calendario/Calendario'
import Presenca from './components/presenca/Presenca'
import ConfiguracaoMes from './components/configuracaoMes/ConfiguracaoMes'
import ResumoMes from './components/resumoMes/ResumoMes'
import GerenciarUsuarios from './components/gerenciarUsuarios/GerenciarUsuarios'
import HistoricoConfiguracoes from './components/historicoConfiguracoes/HistoricoConfiguracoes'
import BackupRestore from './components/backup/BackupRestore'
import Login from './components/login/Login'
import AlterarSenha from './components/configuracoes/AlterarSenha'
import { FaUsers, FaHistory } from 'react-icons/fa'
import { FiLogOut } from 'react-icons/fi'
import { useApi } from './context/ApiContext'
import './globalLoader.css'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('auth_token')
  return token ? children : <Navigate to="/login" replace />
}

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshResumo, setRefreshResumo] = useState(0);
  const [modalUsuarios, setModalUsuarios] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);
  const navigate = useNavigate();

  const triggerRefreshResumo = () => setRefreshResumo(prev => prev + 1);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <FullScreenLoader />
      <header className='header'>
        <img className='logo' src={logo} alt="AliMentto logo"/>
        <div className='textosHeader'>
          <strong>AliMentto</strong>
          <p>Controle de Almoços</p>
        </div>
        <div style={{ display: 'flex', marginLeft: 'auto', marginRight: '40px'}}>
          <button 
            className='btn-logout' 
            onClick={() => navigate('/alterar-senha')} 
            title="Configurações"
          >
            Senha
          </button>
          <button className='btn-logout' onClick={handleLogout} title="Sair">
            <FiLogOut /> Sair
          </button>
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

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/alterar-senha" element={
        <PrivateRoute>
          <AlterarSenha />
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
