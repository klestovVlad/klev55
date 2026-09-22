import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TabBar } from '@/components/TabBar';
import { MapScreen } from '@/screens/MapScreen';
import { PlanScreen } from '@/screens/PlanScreen';
import { SpeciesListScreen, SpeciesScreen } from '@/screens/SpeciesScreen';
import { RulesScreen } from '@/screens/RulesScreen';
import { applyTheme, useStore } from './store';
import './layout.css';

const qc = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

export function App() {
  const theme = useStore((s) => s.theme);
  useEffect(() => applyTheme(theme), [theme]);
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <div className="app">
          <main className="app__main">
            <Routes>
              <Route path="/" element={<MapScreen />} />
              <Route path="/plan" element={<PlanScreen />} />
              <Route path="/species" element={<SpeciesListScreen />} />
              <Route path="/species/:id" element={<SpeciesScreen />} />
              <Route path="/rules" element={<RulesScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <TabBar />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
