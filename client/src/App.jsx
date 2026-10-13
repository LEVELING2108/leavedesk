import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { api, getErrorMessage } from './api/client';

function Home() {
  const [health, setHealth] = useState('checking...');

  useEffect(() => {
    api.get('/health')
      .then(({ data }) => setHealth(`API ${data.status}, DB ${data.db}`))
      .catch((err) => setHealth(`API unreachable: ${getErrorMessage(err)}`));
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>LeaveDesk</h1>
      <p>{health}</p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* TODO: /login, /register, role-protected dashboards */}
      </Routes>
    </BrowserRouter>
  );
}
