export const PRODUCT_NODE_ID_PREFIX = 'gid://shopify/Product/';
export const nodeIdToProductId = (id: string): string => {
  return id.replace(PRODUCT_NODE_ID_PREFIX, '');
};
