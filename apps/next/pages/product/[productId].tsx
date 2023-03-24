import { NavLayout } from '~/lib/NavLayout';
import type { SolitoPage } from 'solito';
import { ProductScreen } from 'app/features/product/ProductScreen';

// Use ModelViewer like so: https://github.com/thirdweb-dev/js/blob/main/packages/react/src/evm/components/ModelViewer.tsx
const ProductDetail: SolitoPage = () => <ProductScreen />;

ProductDetail.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default ProductDetail;
