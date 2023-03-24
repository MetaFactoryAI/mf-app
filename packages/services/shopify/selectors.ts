import { Selector } from './__generated__/zeus';

export const shopifyProductSelector = Selector('Product')({
  id: true,
  createdAt: true,
  publishedAt: true,
  title: true,
  description: [{}, true],
  featuredImage: {
    url: [{}, true],
  },
  handle: true,
  onlineStoreUrl: true,
  tags: true,
  status: true,
  productType: true,
  productCategory: {
    productTaxonomyNode: {
      id: true,
      fullName: true,
      name: true,
    },
  },
});
