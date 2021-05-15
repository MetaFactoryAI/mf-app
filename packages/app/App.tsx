import { BaseComponent } from '@mf/components';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const App: React.FC = () => (
  <View style={styles.container}>
    <BaseComponent />
    <Text>Open up App.tsx to start working on your app!</Text>
    <StatusBar style="auto" />
  </View>
)

const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
});
