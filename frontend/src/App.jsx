import { useState } from 'react'
import './App.css'
import logo from './assets/logo.png'
import Calendario from './components/calendario/Calendario'
import Presenca from './components/presenca/Presenca'
import ConfiguracaoMes from './components/configuracaoMes/ConfiguracaoMes'
import ResumoMes from './components/resumoMes/ResumoMes'

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshResumo, setRefreshResumo] = useState(0);

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
        </div>

        <div className='div3'>
          <ResumoMes selectedDate={selectedDate} refreshTrigger={refreshResumo}/>
        </div>
      </div>
    </>
  )
}

export default App
