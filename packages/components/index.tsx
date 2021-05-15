import React from 'react';
import { StyleSheet, View } from 'react-native';

export const BaseComponent: React.FC = () => <View style={styles.base}/>

const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  base: { backgroundColor: 'red', height: 500, width: 500 }
})

