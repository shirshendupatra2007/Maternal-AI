import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import PreciseInputPage from './pages/PreciseInputPage';
import ConversationPage from './pages/ConversationPage';
import LoginModal from './pages/LoginModal';

function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/input/precise" element={<PreciseInputPage />} />
          <Route path="/input/conversation" element={<ConversationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/:tab" element={<DashboardPage />} />
        </Routes>
        <LoginModal />
      </AppProvider>
    </HashRouter>
  );
}

export default App;
