import React from 'react';
import { StyleSheet, View } from 'react-native';

export const BaseComponent: React.FC = () => <View style={styles.base} />;

const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  base: { backgroundColor: 'cyan', height: 200, width: 200 },
});
