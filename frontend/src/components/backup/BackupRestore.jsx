import React, { useState, useRef } from 'react'
import { FaDownload, FaUpload } from 'react-icons/fa'
import './BackupRestore.css'
import { useApi } from '../../context/ApiContext'

export default function BackupRestore(){
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)
  const { request } = useApi()

  const exportData = async () =>{
    setLoading(true)
    setMessage('')
    try{
      const res = await request('/export')
      if (!res.ok) throw new Error('Export failed')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const name = `alimentto-export-${new Date().toISOString().slice(0,10)}.json`
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMessage('Exportado com sucesso')
    }catch(err){
      setMessage('Erro ao exportar: ' + err.message)
    }finally{setLoading(false)}
  }

  const onFileChange = async (e) =>{
    const file = e.target.files && e.target.files[0]
    if(!file) return
    setLoading(true)
    setMessage('')
    const form = new FormData()
    form.append('file', file)
    try{
      const res = await request('/import', { method: 'POST', body: form })
      const body = await res.json()
      if (!res.ok) throw new Error(body.detail || JSON.stringify(body))
      setMessage('Importado com sucesso')
      fileRef.current.value = ''
    }catch(err){
      setMessage('Erro ao importar: ' + err.message)
    }finally{setLoading(false)}
  }

  const triggerFile = () => {
    setMessage('')
    if(fileRef.current) fileRef.current.click()
  }

  return (
    <>
      <button className='btn-gerenciar' onClick={exportData} disabled={loading} title="Exportar banco">
        <FaDownload /> Exportar
      </button>
      <input ref={fileRef} id="backup-file" type="file" accept=".json,application/json" style={{display:'none'}} onChange={onFileChange} />
      <button className='btn-gerenciar' onClick={triggerFile} disabled={loading} title="Importar banco">
        <FaUpload /> Importar
      </button>
      {message && <div className="br-message">{message}</div>}
    </>
  )
}
