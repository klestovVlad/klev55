import { useEffect, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TabBar } from '@/components/TabBar';
import { MapScreen } from '@/screens/MapScreen';
const PlanScreen = lazy(() => import('@/screens/PlanScreen').then((m) => ({ default: m.PlanScreen })));
const SpeciesListScreen = lazy(() => import('@/screens/SpeciesScreen').then((m) => ({ default: m.SpeciesListScreen })));
const SpeciesScreen = lazy(() => import('@/screens/SpeciesScreen').then((m) => ({ default: m.SpeciesScreen })));
const GearListScreen = lazy(() => import('@/screens/GearScreen').then((m) => ({ default: m.GearListScreen })));
const GearScreen = lazy(() => import('@/screens/GearScreen').then((m) => ({ default: m.GearScreen })));
const RulesScreen = lazy(() => import('@/screens/RulesScreen').then((m) => ({ default: m.RulesScreen })));
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
            <Suspense fallback={<div className="screen"><div className="screen__inner"><div className="skeleton" style={{ width: '40%' }} /><div className="skeleton" /><div className="skeleton" style={{ width: '70%' }} /></div></div>}>
              <Routes>
                <Route path="/" element={<MapScreen />} />
                <Route path="/plan" element={<PlanScreen />} />
                <Route path="/species" element={<SpeciesListScreen />} />
                <Route path="/species/:id" element={<SpeciesScreen />} />
                <Route path="/gear" element={<GearListScreen />} />
                <Route path="/gear/:id" element={<GearScreen />} />
                <Route path="/rules" element={<RulesScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <TabBar />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
