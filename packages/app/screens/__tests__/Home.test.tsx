import React from 'react';

import { fireEvent, render } from '../../__testHelpers__/customRender';
import { createMockNavProps } from '../../__testHelpers__/mockNavigator';
import { TEST_IDS } from '../../__testHelpers__/testIDs';
import { Screen } from '../../navigation/types';
import { HomeScreen, Props as HomeScreenProps } from '../Home';

describe('HomeScreen', () => {
  const mockProps = createMockNavProps<HomeScreenProps>();

  it('Should render Home screen', () => {
    const { getByText } = render(<HomeScreen {...mockProps} />);
    expect(getByText('Proposals')).toBeTruthy();
  });

  it('Should navigate to Proposal screen', () => {
    const { getByTestId } = render(<HomeScreen {...mockProps} />);

    fireEvent.press(getByTestId(TEST_IDS.HOME.proposalCard));
    expect(mockProps.navigation.navigate).toHaveBeenCalledTimes(1);
    expect(mockProps.navigation.navigate).toHaveBeenCalledWith(
      Screen.PROPOSAL,
      expect.anything(),
    );
  });
});
