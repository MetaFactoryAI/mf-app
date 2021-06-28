import { PageContainer } from '@mf/components/PageContainer';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { MainStackScreenProps, Screen } from '../navigation/types';

type Props = MainStackScreenProps<Screen.PROPOSAL>;

export const ProposalScreen: React.FC<Props> = () => (
  <PageContainer>
    <Text style={styles.text}>Proposal</Text>
  </PageContainer>
);

// eslint-disable-next-line import/no-default-export
export default ProposalScreen;

const styles = StyleSheet.create({
  text: {
    fontSize: 24,
    margin: 10,
  },
});
