import type { SolitoPage } from 'solito';

import { CurationScreen } from 'app/features/curate/CurationScreen';

import { NavLayout } from '../lib/NavLayout';

const Curate: SolitoPage = () => <CurationScreen />;

Curate.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Curate;
