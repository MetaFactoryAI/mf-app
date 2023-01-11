import { NavLayout } from '../lib/NavLayout';
import type { SolitoPage } from 'solito';
import { SecondScreen } from 'app/features/home/SecondScreen';

const Settings: SolitoPage = () => <SecondScreen title={'My Inventory'} />;

Settings.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Settings;
