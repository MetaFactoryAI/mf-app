import { TransitionPresets } from '@react-navigation/stack';
import { Platform } from 'react-native';

export const ModalPreset = {
  headerShown: false,
  gestureEnabled: true,
  cardOverlayEnabled: true,
  ...Platform.select({
    ios: TransitionPresets.ModalPresentationIOS,
    default: TransitionPresets.ModalTransition,
  }),
};

export const StackPreset = {};
