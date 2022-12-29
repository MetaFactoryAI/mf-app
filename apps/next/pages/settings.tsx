import { SettingsScreen } from 'app/features/settings/SettingsScreen';
import { NavLayout } from '../lib/NavLayout';
import { type SolitoPage } from 'solito';

const Settings: SolitoPage = () => <SettingsScreen />;

Settings.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Settings;
