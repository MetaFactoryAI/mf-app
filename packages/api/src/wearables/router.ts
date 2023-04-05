import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import { readContract } from '@wagmi/core';
import { BigNumber } from '@ethersproject/bignumber';

import {
  NftWearablesAbi,
  NftWearablesAddress,
} from 'contracts/abis/NftWearables';
import { NftClaim } from './types';
import { productNftMetadataSelector } from 'services/mfos/products/selectors';
import { getMetadataForProduct } from 'shared/utils/wearableMetadata';

export const wearablesRouter = createTRPCRouter({
  merkleClaims: protectedProcedure.query(async ({ ctx }) => {
    const res = await ctx.hasuraClient.query({
      robot_merkle_claims: [
        {
          where: {
            merkle_root: { network: { _eq: ctx.chain.network } },
            recipient_eth_address: { _eq: ctx.session.address },
          },
        },
        {
          claim_json: [{}, true],
          merkle_root_hash: true,
        },
      ],
    });

    return res.robot_merkle_claims as NftClaim[];
    // return nftClaimArray.map((nftClaim) => {
    //   const claim_count = nftClaim.claim_json.erc1155[0].ids.length;
    //
    //   return {
    //     ...nftClaim,
    //     claim_json: {
    //       ...nftClaim.claim_json,
    //     },
    //   };
    // });
  }),
  byAddress: publicProcedure
    .input(z.string().optional())
    .query(async ({ ctx, input }) => {
      const address = input || ctx.session?.address;
      if (!address) return null;

      try {
        const tokenIdRes = await ctx.mfosClient('query')({
          products: [
            { filter: { nft_token_id: { _nnull: true } } },
            { nft_token_id: true, id: true },
          ],
        });

        const allTokenIds = tokenIdRes.products.map((p) =>
          // Query filters non nulls
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          BigNumber.from(p.nft_token_id!),
        );

        const balances = await readContract({
          address: NftWearablesAddress[ctx.chain.id],
          abi: NftWearablesAbi,
          functionName: 'balanceOfBatch',
          args: [Array(allTokenIds.length).fill(address), allTokenIds],
          chainId: ctx.chain.id,
        });
        const tokenIdsForUser = balances.reduce(
          (ids: number[], balance, index) => {
            if (balance.isZero()) return ids;

            const tokenId = allTokenIds[index].toNumber();
            return [...ids, tokenId];
          },
          [],
        );

        const nftMetadataRes = await ctx.mfosClient('query')({
          products: [
            { filter: { nft_token_id: { _in: tokenIdsForUser } } },
            productNftMetadataSelector,
          ],
        });

        return (nftMetadataRes.products || []).map((p) => ({
          id: p.id,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          nft_token_id: p.nft_token_id!,
          nft_metadata: getMetadataForProduct(p),
        }));
      } catch (e) {
        console.log(e);
        return [];
      }
    }),
});
