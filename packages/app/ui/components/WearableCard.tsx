import React from 'react';
import { Card } from 'app/ui/layout/Card';
import { Box } from 'app/ui/layout/Box';
import { Text } from 'app/ui/typography';
import { Separator } from 'app/ui/layout/Separator';
import { WearableMetadata } from 'shared/types/wearableTypes';

export type Props = React.ComponentProps<typeof Card> & {
  metadata: WearableMetadata;
  tokenId: number;
};

export const WearableCard: React.FC<Props> = ({ metadata, ...props }) => (
  <Card {...props}>
    <Box className={'p-4'}>
      <Text className="font-bold">{metadata.name}</Text>
      {metadata.properties.brand ? (
        <Text intent="caption" className={'mt-1'}>
          {metadata.properties.brand}
        </Text>
      ) : null}
    </Box>
    <Separator />
  </Card>
);
