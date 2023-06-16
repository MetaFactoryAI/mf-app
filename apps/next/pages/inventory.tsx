import type { SolitoPage } from 'solito';

import { SecondScreen } from 'app/features/home/SecondScreen';

import { NavLayout } from '../lib/NavLayout';

const Settings: SolitoPage = () => <SecondScreen title={'My Inventory'} />;

Settings.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Settings;
