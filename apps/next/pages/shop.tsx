import type { SolitoPage } from 'solito';

import { ShopScreen } from 'app/features/shop/ShopScreen';

import { NavLayout } from '~/lib/NavLayout';

const Shop: SolitoPage = () => <ShopScreen />;

Shop.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default Shop;
