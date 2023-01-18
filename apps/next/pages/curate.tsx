import { NavLayout } from '../lib/NavLayout';
import type { SolitoPage } from 'solito';
import { CurationScreen } from 'app/features/curate/CurationScreen';

const Curate: SolitoPage = () => <CurationScreen />;

Curate.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Curate;
