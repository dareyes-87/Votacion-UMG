// src/main.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import AdminDashboard from './pages/AdminDashboard'
import Votacion from './pages/Votacion'
import ResultadosLive from './pages/ResultadosLive'
import ReactDOM from 'react-dom/client'
import './index.css'
import Squares from './Squares';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Squares 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='#fff'
          hoverFillColor='#222'
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/votar" element={<Votacion />} />
        <Route path="/resultados" element={<ResultadosLive />} />
      </Routes>
    </Layout>
  </BrowserRouter>
)