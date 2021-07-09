import { Box, Card, ProgressBar, Separator, StyledText } from '@mf/ui';
import { Tag } from '@mf/ui/feedback/Tag';
import React from 'react';

export type Props = React.ComponentProps<typeof Card> & {
  title: string;
  author: string;
  brand?: string;
  tags: string[];
};

export const ProductProposalCard: React.FC<Props> = ({
  title,
  author,
  brand,
  tags,
  ...props
}) => (
  <Card {...props}>
    <Box
      centered
      bg="shapeBgContrast"
      position="absolute"
      top={0}
      right={0}
      height={32}
      aspectRatio={1}
    >
      <StyledText variant="label" color="buttonSolidContent">
        #1
      </StyledText>
    </Box>
    <Box p="m">
      <StyledText fontWeight="bold">{title}</StyledText>
      <StyledText variant="caption" mt="xs">
        by {author}
        {brand ? ` for ${brand}` : null}
      </StyledText>
      <Box row flexWrap="wrap">
        {tags.map((t) => (
          <Tag label={t} key={t} mr="s" mt="s" />
        ))}
      </Box>
    </Box>
    <Separator />
    <Box p="m">
      <Box row>
        <StyledText variant="label" color="secondaryContent">
          {'Status: '}
        </StyledText>
        <StyledText variant="label">Proposal</StyledText>
      </Box>
      <ProgressBar progress={0.15} mt="s" />
    </Box>
  </Card>
);
