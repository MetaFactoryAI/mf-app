import { NavLayout } from '~/lib/NavLayout';
import type { SolitoPage } from 'solito';
import { Inventory } from 'app/features/inventory/Inventory';

const InventoryPage: SolitoPage = () => <Inventory />;

InventoryPage.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default InventoryPage;
