export const darkTheme = {
  colors: {
    // Background colors
    background: '#0D1117',
    surface: '#161B22',
    surfaceHover: '#21262D',
    
    // Text colors
    text: '#F0F6FC',
    textSecondary: '#8B949E',
    textMuted: '#6E7681',
    
    // Border colors
    border: '#30363D',
    borderHover: '#484F58',
    borderActive: '#F78166',
    
    // Primary colors
    primary: '#58A6FF',
    primaryHover: '#1F6FEB',
    primaryActive: '#1158C7',
    
    // Status colors
    success: '#3FB950',
    warning: '#D29922',
    error: '#F85149',
    info: '#58A6FF',
    
    // Syntax highlighting colors
    syntax: {
      keyword: '#FF7B72',
      string: '#A5C261',
      comment: '#6E7681',
      number: '#79C0FF',
      operator: '#FF7B72',
      function: '#D2A8FF',
      variable: '#FFA657',
      type: '#F0F6FC',
      tag: '#7EE787',
      attribute: '#79C0FF',
      value: '#A5C261'
    },
    
    // AI Chat colors
    ai: {
      user: '#238636',
      assistant: '#1F6FEB',
      system: '#8B949E',
      error: '#DA3633'
    },
    
    // Terminal colors
    terminal: {
      background: '#0D1117',
      foreground: '#F0F6FC',
      cursor: '#58A6FF',
      selection: '#58A6FF40'
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
    small: '0 1px 3px rgba(0, 0, 0, 0.12)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.16)',
    large: '0 10px 25px rgba(0, 0, 0, 0.20)',
    xlarge: '0 20px 40px rgba(0, 0, 0, 0.24)'
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