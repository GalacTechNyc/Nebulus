import React from 'react';

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <div className="layout" style={{ display: 'flex', height: '100%' }}>{children}</div>;
};