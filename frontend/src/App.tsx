import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

/**
 * Minimal routed shell for Phase 0. Feature routes (Focus, History, Schedule,
 * Profile, Auth, ...) are added in later phases. The id/route convention will
 * mirror the legacy hash-router sections.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
