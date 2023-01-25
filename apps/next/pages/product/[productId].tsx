import { NavLayout } from '~/lib/NavLayout';
import type { SolitoPage } from 'solito';
import { ProductScreen } from 'app/features/product/ProductScreen';

const ProductDetail: SolitoPage = () => <ProductScreen />;

ProductDetail.getLayout = (page) => <NavLayout>{page}</NavLayout>;

export default ProductDetail;
