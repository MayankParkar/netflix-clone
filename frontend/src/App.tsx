import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { isLoggedIn, clearTokens } from './lib/auth';

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  const handleLogout = () => {
    clearTokens();
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <LoginPage onSuccess={() => setLoggedIn(true)} />;
  }

  return <HomePage onLogout={handleLogout} />;
}

export default App;
