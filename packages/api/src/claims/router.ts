import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import {
  baseProductsSelector,
  contributorsSelector,
} from '../products/selectors';
import { productsFilesSelector } from 'services/mfos/products/selectors';
import { ResolverInputTypes } from 'services/mfos';
import {
  getProductTags,
  getProgressFromTagsAndStage,
} from 'shared/utils/productHelpers';
import { NftClaim } from './types';

export const claimsRouter = createTRPCRouter({
  wearableMerkleClaims: protectedProcedure
    .input(z.string().optional().default('mainnet'))
    .query(async ({ ctx, input }) => {
      const network = input;

      const res = await ctx.hasuraClient.query({
        robot_merkle_claims: [
          {
            where: {
              merkle_root: { network: { _eq: network } },
              recipient_eth_address: { _eq: ctx.session.address },
            },
          },
          {
            claim_json: [{ path: '' }, true],
            merkle_root_hash: true,
          },
        ],
      });

      const nftClaimArray = res.robot_merkle_claims as NftClaim[];
      const currentNftClaims = nftClaimArray.map((nftClaim) => {
        const claim_count = nftClaim.claim_json.erc1155[0].ids.length;

        return {
          ...nftClaim,
          claim_json: {
            ...nftClaim.claim_json,
            claim_count,
          },
        };
      });

      return currentNftClaims;
    }),
  byId: publicProcedure
    .input(z.string().optional())
    .query(async ({ ctx, input }) => {
      if (!input) return null;

      const res = await ctx.mfosClient('query')({
        products_by_id: [
          { id: input },
          {
            ...baseProductsSelector,
            ...contributorsSelector,
            ...productsFilesSelector,
          },
        ],
      });

      return res.products_by_id;
    }),
});
