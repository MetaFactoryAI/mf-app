import { ShopScreen } from 'app/features/shop/ShopScreen';
import { NavLayout } from '../lib/NavLayout';
import type { SolitoPage } from 'solito';

const Shop: SolitoPage = () => <ShopScreen />;

Shop.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Shop;
