import { StatusBar } from 'expo-status-bar';
import { H1, P } from 'app/ui/typography';
import { Box } from 'app/ui/layout';

export const SettingsScreen: React.FC = () => {
  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H1>Settings</H1>
      <P className="text-center">Settings screen</P>
      <StatusBar style="light" />
    </Box>
  );
};
