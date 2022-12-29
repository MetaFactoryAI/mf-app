import React from 'react';
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
  Inter_300Light,
} from '@expo-google-fonts/inter';
import { fontNames } from '../ui/theme/fonts';

type Props = {
  children: React.ReactNode;
};

export const Fonts: React.FC<Props> = ({ children }) => {
  const [loaded] = useFonts({
    [fontNames.light]: Inter_300Light,
    [fontNames.normal]: Inter_400Regular,
    [fontNames.bold]: Inter_700Bold,
  });
  if (!loaded) return null;
  return <>{children}</>;
};
