import { Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

export const triggerTapHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    Vibration.vibrate(10);
  }
};
