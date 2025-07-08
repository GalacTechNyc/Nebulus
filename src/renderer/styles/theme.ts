export const darkTheme = {
  colors: {
    // Cyberpunk Background colors
    background: '#0A0A0A',
    surface: '#111111',
    surfaceHover: '#1A1A1A',
    
    // Neon Text colors
    text: '#E0E0E0',
    textSecondary: '#00D4FF',
    textMuted: '#666666',
    
    // Cyberpunk Border colors
    border: '#FF006E',
    borderHover: '#FF1B8D',
    borderActive: '#FF3FA4',
    
    // Neon Primary colors
    primary: '#00FFFF',
    primaryHover: '#00E6E6',
    primaryActive: '#00CCCC',
    
    // Vibrant Status colors
    success: '#00FF41',
    warning: '#FFD700',
    error: '#FF073A',
    info: '#00D4FF',
    
    // Enhanced Syntax highlighting colors
    syntax: {
      keyword: '#FF0080',
      string: '#00FF80',
      comment: '#666666',
      number: '#FFFF00',
      operator: '#FF0080',
      function: '#FF8000',
      variable: '#00FFFF',
      type: '#FF6000',
      tag: '#80FF00',
      attribute: '#0080FF',
      value: '#00FF80'
    },
    
    // Cyberpunk AI Chat colors
    ai: {
      user: '#00FF41',
      assistant: '#00FFFF',
      system: '#FF006E',
      error: '#FF073A'
    },
    
    // Terminal colors
    terminal: {
      background: '#0A0A0A',
      foreground: '#00FF00',
      cursor: '#00FFFF',
      selection: '#00FFFF40'
    }
  },
  
  fontSizes: {
    small: '12px',
    medium: '14px',
    large: '16px',
    xlarge: '18px',
    xxlarge: '24px'
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  borderRadius: {
    small: '4px',
    medium: '6px',
    large: '8px',
    xlarge: '12px'
  },
  
  shadows: {
    small: '0 0 5px rgba(0, 255, 255, 0.3)',
    medium: '0 0 10px rgba(255, 0, 110, 0.4)',
    large: '0 0 20px rgba(0, 255, 255, 0.5)',
    xlarge: '0 0 30px rgba(255, 0, 110, 0.6)',
    neonCyan: '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 40px #00FFFF',
    neonPink: '0 0 10px #FF006E, 0 0 20px #FF006E, 0 0 40px #FF006E',
    neonGreen: '0 0 10px #00FF41, 0 0 20px #00FF41, 0 0 40px #00FF41',
    neonYellow: '0 0 10px #FFFF00, 0 0 20px #FFFF00, 0 0 40px #FFFF00'
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070
  },
  
  transitions: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.35s ease'
  }
};

export type Theme = typeof darkTheme;

// Styled-components theme type declaration
declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}