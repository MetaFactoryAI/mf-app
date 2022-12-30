import React from 'react';

import { render } from '../../__testHelpers__/customRender';
import { createMockNavProps } from '../../__testHelpers__/mockNavigator';
import { ProposalScreen, Props as ProposalScreenProps } from '../Proposal';

const mockProps = createMockNavProps<ProposalScreenProps>();

describe('ProposalScreen', () => {
  it('Should render Proposal screen', () => {
    const { getByText } = render(<ProposalScreen {...mockProps} />);
    expect(getByText('Proposal Details')).toBeTruthy();
  });
});
