import type { SolitoPage } from 'solito';

import { HomeScreen } from 'app/features/home/HomeScreen';

import { NavLayout } from '~/lib/NavLayout';

const Home: SolitoPage = () => <HomeScreen />;

Home.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Home;
