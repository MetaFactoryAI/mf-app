import { H1, P } from 'app/ui/typography';
import Link from 'next/link';

import { RetroButton } from 'app/ui/input/RetroButton';
import { useProducts } from 'app/hooks/productHooks';
import { Box } from 'app/ui/layout/Box';
import { ProductProposalCard } from 'app/ui/components/ProductProposalCard';
import { PRODUCT_STAGES } from 'services/mfos';
import {
  getProductTags,
  getProgressFromTagsAndStage,
} from 'shared/utils/productHelpers';

export const HomeScreen: React.FC = () => {
  const products = useProducts();

  return (
    <Box className="flex-1 items-center p-3">
      <H1>Welcome to MetaFactory</H1>
      <Box className="max-w-xl">
        <P className="text-center">
          MetaFactory is a community-owned brand focused on crafting products &
          experiences that travel seamlessly between digital and physical
          worlds.
        </P>
        <RetroButton className="mt-4" title={`Retro Button`} />
      </Box>
      <Box className="h-8" />
      <Box
        className={
          'grid w-full max-w-screen-lg grid-cols-1 gap-4 md:grid-cols-2'
        }
      >
        {products.data?.map((product) => {
          const tags = getProductTags(product);
          const progress = getProgressFromTagsAndStage(
            tags,
            product.product_stage?.name,
          );
          return (
            <Link
              key={product.name}
              // href={`/product/${product.id}`}
              href={`/`}
              passHref
              legacyBehavior
              scroll={false}
            >
              <ProductProposalCard
                title={product.name}
                brand={product.brand_id?.name}
                tags={tags}
                stage={
                  PRODUCT_STAGES[
                    product.product_stage?.name as keyof typeof PRODUCT_STAGES
                  ]
                }
                progress={progress}
              />
            </Link>
          );
        })}
        <Box className="w-[32px]" />
      </Box>
    </Box>
  );
};
