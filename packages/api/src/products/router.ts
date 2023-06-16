import { z } from 'zod';

import {
  getProductTags,
  getProgressFromTagsAndStage,
} from 'shared/utils/productHelpers';

import { ResolverInputTypes } from 'services/mfos';
import { productsFilesSelector } from 'services/mfos/products/selectors';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { baseProductsSelector, contributorsSelector } from './selectors';

type ProductFilter = ResolverInputTypes['products_filter'];

export const productRouter = createTRPCRouter({
  all: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.number().min(1).optional().default(1),
        filter: z.custom<ProductFilter>().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, filter } = input;

      const res = await ctx.mfosClient('query')({
        products: [
          {
            filter,
            limit,
            page: cursor,
          },
          {
            ...baseProductsSelector,
            ...contributorsSelector,
            ...productsFilesSelector,
          },
        ],
      });

      const nextPage = res.products.length < limit ? undefined : cursor + 1;
      return {
        products: res.products.map((product) => {
          const tags = getProductTags(product);
          return {
            ...product,
            tags,
            progress: getProgressFromTagsAndStage(
              tags,
              product.product_stage?.name,
            ),
          };
        }),
        nextPage,
      };
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
