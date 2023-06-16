import type { SolitoPage } from 'solito';

import { ProductScreen } from 'app/features/product/ProductScreen';

import { NavLayout } from '~/lib/NavLayout';

// Use ModelViewer like so: https://github.com/thirdweb-dev/js/blob/main/packages/react/src/evm/components/ModelViewer.tsx
const ProductDetail: SolitoPage = () => <ProductScreen />;

ProductDetail.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default ProductDetail;
