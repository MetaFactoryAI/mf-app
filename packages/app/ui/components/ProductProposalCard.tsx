import React from 'react';
import { Card } from 'app/ui/layout/Card';
import { Box } from 'app/ui/layout/Box';
import { Text } from 'app/ui/typography';
import { Row } from 'app/ui/layout/Row';
import { ProgressBar } from 'app/ui/feedback/ProgressBar';
import { Tag } from 'app/ui/feedback/Tag';
import { Separator } from 'app/ui/layout/Separator';
import type { ProductStage } from 'services/mfos';
import type { ProductTag } from 'shared/utils/productHelpers';

export type Props = React.ComponentProps<typeof Card> & {
  title: string;
  brand?: string;
  tags?: ProductTag[];
  rank?: number;
  stage: ProductStage;
  progress: number;
};

export const ProductProposalCard: React.FC<Props> = ({
  title,
  brand,
  tags,
  rank,
  stage,
  progress,
  ...props
}) => (
  <Card {...props}>
    {rank ? (
      <Box
        className={
          'bg-blackA-12 min-w-8 absolute top-0 right-0 h-8 items-center justify-center px-4'
        }
      >
        <Text intent="label" className={'text-brand-9'}>
          #{rank}
        </Text>
      </Box>
    ) : null}
    <Box className={'p-4'}>
      <Text className="font-bold">{title}</Text>
      {brand ? (
        <Text intent="caption" className={'mt-1'}>
          {brand}
        </Text>
      ) : null}
    </Box>
    <Separator />
    <Box className={'p-4'}>
      <Row>
        <Text intent="label">{'Status: '}</Text>
        <Text intent="label">{stage.displayName}</Text>
      </Row>
      <ProgressBar progress={progress} className={'mt-2'} />
      {tags && (
        <Row className={`mt-2 flex-wrap`}>
          {tags.map((t) => (
            <Tag
              label={t.name}
              key={t.name}
              className={`mr-2 mt-2 ${t.className}`}
            />
          ))}
        </Row>
      )}
    </Box>
  </Card>
);
