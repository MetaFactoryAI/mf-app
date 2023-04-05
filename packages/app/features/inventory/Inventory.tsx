import { H3 } from 'app/ui/typography';
import { Box } from 'app/ui/layout/Box';
import { api } from 'app/lib/api';
import { formatAddress } from 'shared/utils/addressHelpers';
import { WearableCard } from 'app/ui/components/WearableCard';
import { useAccount } from 'wagmi';

type InventoryProps = {
  // address?: string;
};

export const Inventory: React.FC<InventoryProps> = () => {
  const { address } = useAccount();
  const { data, isLoading } = api.wearables.byAddress.useQuery(address);

  const formattedAddress = formatAddress(address);

  return (
    <Box className="flex-1 items-center justify-center p-3">
      <H3>{`${formattedAddress}'s Inventory`}</H3>
      <Box
        className={
          'grid w-full max-w-screen-lg grid-cols-1 gap-4 md:grid-cols-2'
        }
      >
        {data ? (
          data.map((wearable) => {
            return (
              <WearableCard
                key={wearable.id}
                metadata={wearable.nft_metadata}
                tokenId={wearable.nft_token_id}
              />
            );
          })
        ) : (
          <H3>{isLoading ? 'Loading' : 'No Wearables'}</H3>
        )}
      </Box>
    </Box>
  );
};
