import { TransitionPresets } from '@react-navigation/stack';
import { Platform } from 'react-native';

export const ModalPreset = {
  headerShown: false,
  gestureEnabled: true,
  animationEnabled: true,
  cardOverlayEnabled: true,
  ...Platform.select({
    ios: TransitionPresets.ModalPresentationIOS,
    default: TransitionPresets.ModalTransition,
  }),
};

export const StackPreset = {
  animationEnabled: true,
};
