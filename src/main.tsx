import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PrimeReactProvider } from "primereact/api";
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'primereact/resources/primereact.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';

import './index.css';
import './flags.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PrimeReactProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/upload?modul=&firmaGuid=&fisTurId=&satirGuid=" />} />
          <Route path="/upload" element={<App />} />
        </Routes>
      </PrimeReactProvider>
    </BrowserRouter>
  </StrictMode>,
)
