import { TransitionPresets } from '@react-navigation/stack';
import { Platform } from 'react-native';

export const ModalPreset = {
  headerShown: false,
  gestureEnabled: true,
  animationEnabled: true,
  cardOverlayEnabled: true,
  ...Platform.select({
    android: TransitionPresets.ModalTransition,
    default: TransitionPresets.ModalPresentationIOS,
  }),
};

export const StackPreset = {
  animationEnabled: true,
};
