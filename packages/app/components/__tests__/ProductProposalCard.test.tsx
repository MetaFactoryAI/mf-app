import React from 'react';

import { render } from '../../__testHelpers__/customRender';
import { ProductProposalCard } from '../ProductProposalCard';

describe('ProductProposalCard', () => {
  const mockProps = {
    title: 'Title',
    author: 'Author',
    brand: 'Brand',
    tags: ['tag1', 'tag2'],
  };

  it('Renders proposal details', () => {
    const { getByText } = render(<ProductProposalCard {...mockProps} />);
    expect(getByText(mockProps.title)).toBeTruthy();
  });
});
