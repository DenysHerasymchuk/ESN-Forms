import { Route, Routes } from 'react-router-dom'
import { EsncardPage } from './pages/legacy/EsncardPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<EsncardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
