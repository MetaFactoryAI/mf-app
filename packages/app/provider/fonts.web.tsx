import React from 'react';

// Don't load expo fonts on web
export const Fonts = ({ children }: { children: React.ReactElement }) => (
  <>{children}</>
);
