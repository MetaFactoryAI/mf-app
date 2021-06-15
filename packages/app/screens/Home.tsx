import { BaseComponent } from '@mf/components';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { MainStackScreenProps, Screen } from '../navigation/types';

type Props = MainStackScreenProps<Screen.HOME>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.text}>Home</Text>
    <BaseComponent />
    <Button
      title="Go To Screen"
      onPress={() => navigation.navigate(Screen.PROPOSAL, { proposalId: '1' })}
    />
    <StatusBar style="auto" />
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
