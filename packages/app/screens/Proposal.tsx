import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MainStackScreenProps, Screen } from '../navigation/types';

type Props = MainStackScreenProps<Screen.PROPOSAL>;

export const ProposalScreen: React.FC<Props> = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Proposal</Text>
  </View>
);

const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  container: {
    alignItems: 'center',
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    margin: 10,
  },
});
