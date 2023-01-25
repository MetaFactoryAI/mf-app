import { Selector } from 'services/mfos';
import { fileSelector } from 'services/mfos/files/selectors';

export const baseProductsSelector = Selector('products')({
  id: true,
  name: true,
  description: true,
  product_stage: [{}, { name: true, sort: true }],
  shopify_id: true,
  notion_id: true,
});

export const contributorsSelector = Selector('products')({
  brand_id: [
    {},
    {
      id: true,
      name: true,
      eth_address: true,
      logo: [{}, fileSelector],
    },
  ],
  contributors: [
    {},
    {
      id: true,
      contribution_share: true,
      collaborators_id: [
        {},
        {
          id: true,
          role: [{}, { name: true, id: true }],
          display_name: true,
        },
      ],
    },
  ],
});
