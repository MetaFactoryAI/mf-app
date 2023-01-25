import * as React from 'react';
import { H1, P } from 'app/ui/typography';
import Link from 'next/link';

import { RetroButton } from 'app/ui/input/RetroButton';
import { Box } from 'app/ui/layout/Box';
import { ProductProposalCard } from 'app/ui/components/ProductProposalCard';
import { PRODUCT_STAGES } from 'services/mfos';
import { api } from 'app/lib/api';

export const HomeScreen: React.FC = () => {
  const { data, fetchNextPage, hasNextPage } = api.product.all.useInfiniteQuery(
    {
      // filter: {
      //   product_stage: { name: { _in: [PRODUCT_STAGES.sale_live.name] } },
      // },
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  );

  return (
    <Box className="flex-1 items-center p-3">
      <H1>Welcome to MetaFactory</H1>
      <Box className="max-w-xl">
        <P className="text-center">
          MetaFactory is a community-owned brand focused on crafting products &
          experiences that travel seamlessly between digital and physical
          worlds.
        </P>
      </Box>
      <Box className="h-8" />
      <Box
        className={
          'grid w-full max-w-screen-lg grid-cols-1 gap-4 md:grid-cols-2'
        }
      >
        {data?.pages.map((page) => (
          <React.Fragment key={page.nextPage}>
            {page.products.map((product) => {
              return (
                <Link
                  key={product.name}
                  href={`/product/${product.id}`}
                  // href={`/`}
                  passHref
                  legacyBehavior
                  scroll={false}
                >
                  <ProductProposalCard
                    title={product.name}
                    brand={product.brand_id?.name}
                    tags={product.tags}
                    stage={
                      PRODUCT_STAGES[
                        product.product_stage
                          ?.name as keyof typeof PRODUCT_STAGES
                      ]
                    }
                    progress={product.progress}
                  />
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </Box>
      {hasNextPage && (
        <RetroButton
          className="my-10"
          title={`Load More`}
          onClick={() => fetchNextPage()}
        />
      )}

      <Box className="w-[32px]" />
    </Box>
  );
};
