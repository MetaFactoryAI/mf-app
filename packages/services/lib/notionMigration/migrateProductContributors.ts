/* eslint-disable no-await-in-loop */
import assert from 'assert';

import { hasuraClient } from '../../graphql/client';
import { Client, COLLABORATOR_ROLES } from '../../mfos';
import { Creator } from '../../types/wearables';
import { isAddressEqual } from '../../utils/addressHelpers';
import { logger } from '../../utils/logger';
import {
  getProductDesigners,
  getProductTechs,
} from '../../utils/notion/productHelpers';
import { getProductPage } from '../notionHelpers';
import { addContributorsToProduct } from '../../mfos/products/mutations';
import {
  collaboratorRolesSelector,
  productsContributorsSelector,
} from '../../mfos/products/selectors';

export async function migrateProductContributors(
  client: Client,
): Promise<void> {
  const productsQuery = await client('query')({
    products: [{ limit: 200 }, productsContributorsSelector],
  });
  assert(productsQuery.products, 'Failed to get products');
  logger.info('Got products', {
    count: productsQuery.products.length,
  });
  let i = 0;
  const roles = await client('query')({
    collaborator_roles: [{}, collaboratorRolesSelector],
  });
  const designerRole = roles.collaborator_roles?.find(
    (r) => r.name === COLLABORATOR_ROLES.designer.name,
  );
  const prodManagerRole = roles.collaborator_roles?.find(
    (r) => r.name === COLLABORATOR_ROLES.productionManager.name,
  );
  const otherRole = roles.collaborator_roles?.find(
    (r) => r.name === COLLABORATOR_ROLES.other.name,
  );
  const brandRole = roles.collaborator_roles?.find(
    (r) => r.name === COLLABORATOR_ROLES.brand.name,
  );
  assert(designerRole, 'Designer role not found');
  assert(prodManagerRole, 'productionManager role not found');
  assert(otherRole, 'Other role not found');
  assert(brandRole, 'Brand role not found');
  for (const p of productsQuery.products) {
    i += 1;
    logger.info(
      `Migrating contributors for ${i} of ${productsQuery.products.length} products - ${p.name}`,
    );
    assert(p.notion_id);
    const productPage = await getProductPage(p.notion_id);

    const rewardsSplit = p.shopify_id
      ? await hasuraClient.query({
          robot_product_designer: [
            { where: { product_id: { _eq: p.shopify_id } } },
            {
              eth_address: true,
              designer_name: true,
              robot_reward: true,
              contribution_share: true,
            },
          ],
        })
      : null;

    const brandRewards = rewardsSplit?.robot_product_designer.find((d) =>
      isAddressEqual(d.eth_address, p.brand_id?.eth_address),
    );
    const brand: Creator | undefined = brandRewards && {
      name: brandRewards.designer_name || '',
      ethAddress: brandRewards.eth_address,
      share: Math.floor((brandRewards.contribution_share as number) * 100),
      robotEarned: brandRewards.robot_reward as number,
    };
    const addReward = (d: Creator) => {
      const rewardData = rewardsSplit?.robot_product_designer.find((r) =>
        isAddressEqual(r.eth_address, d.ethAddress),
      );
      if (!rewardData) {
        logger.warn(`Could not get rewardData for contributor ${d.name}`);
        return d;
      }
      return {
        ...d,
        share: Math.floor((rewardData.contribution_share as number) * 100),
        robotEarned: rewardData.robot_reward as number,
      };
    };
    const designers = getProductDesigners(productPage).map(addReward);
    const techs = getProductTechs(productPage).map((t) => {
      const techWithReward = addReward(t);
      // If designer and tech is the same, dont duplicate the rewards
      if (
        designers.find(
          (d) =>
            isAddressEqual(d.ethAddress, techWithReward.ethAddress) &&
            d.share === techWithReward.share,
        )
      ) {
        logger.warn('Designer and tech is same, not adding reward data', {
          tech: t,
          product: p,
        });
        return t;
      }
      return techWithReward;
    });
    const otherContributors =
      rewardsSplit?.robot_product_designer
        .filter(
          (other) =>
            ![...designers, ...techs].find(
              (d) =>
                isAddressEqual(d.ethAddress, other.eth_address) ||
                isAddressEqual(brand?.ethAddress, other.eth_address),
            ),
        )
        .map(
          (o): Creator => ({
            name: o.designer_name || '',
            share: Math.floor((o.contribution_share as number) * 100),
            robotEarned: o.robot_reward as number,
            ethAddress: o.eth_address,
          }),
        ) || [];

    const totalShare = [...designers, ...techs, ...otherContributors].reduce(
      (acc, c) => acc + (c.share || 0),
      0,
    );
    if (totalShare > 100) {
      logger.warn('Total share over 100!!!');
    }
    logger.info(
      `Adding ${designers.length} designers, ${techs.length} techs, and ${otherContributors.length} other contributors to product ${p.name}`,
      { totalShare },
    );
    await addContributorsToProduct(p, designers, designerRole);
    await addContributorsToProduct(p, techs, prodManagerRole);
    if (brand) {
      await addContributorsToProduct(p, [brand], brandRole);
    }
    await addContributorsToProduct(p, otherContributors, otherRole);
  }
}
