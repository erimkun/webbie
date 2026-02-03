import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import GolfClubEditor from './pages/GolfClubEditor'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/golf-editor" element={<GolfClubEditor />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
