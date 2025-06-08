import React from 'react';
import { ThemeProvider } from 'styled-components';
import Layout from './components/Layout/Layout';
import { AppProvider } from './hooks/useAppState';
import { GlobalStyles } from './styles/GlobalStyles';
import { darkTheme } from './styles/theme';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles />
      <AppProvider>
        <Layout />
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;