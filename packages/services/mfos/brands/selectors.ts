import { Selector } from '../__generated__/user/zeus';

export const brandSelector = Selector('brands')({
  id: true,
  name: true,
  eth_address: true,
  description: true,
  notion_id: true,
  discord_url: true,
  created_at: true,
});
