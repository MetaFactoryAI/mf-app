import { apiFetch, Thunder } from './__generated__/zeus';
import { SHOPIFY_API_TOKEN, SHOPIFY_API_URL } from 'shared/config/secret';

export const shopifyClient = Thunder((...params) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return apiFetch([
    SHOPIFY_API_URL,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  ])(...params);
});
