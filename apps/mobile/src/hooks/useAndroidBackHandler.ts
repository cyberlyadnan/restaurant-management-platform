import { useEffect, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';

interface UseAndroidBackHandlerOptions {
  isRoot?: boolean;
  onCloseModal?: () => boolean | void;
  navigation?: any;
}

export function useAndroidBackHandler({
  isRoot = false,
  onCloseModal,
  navigation,
}: UseAndroidBackHandlerOptions = {}) {
  const lastBackPress = useRef<number>(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handleBackPress = () => {
      // 1. If modal/sheet is active, close it first
      if (onCloseModal) {
        const handled = onCloseModal();
        if (handled !== false) return true;
      }

      // 2. If navigation can go back, pop stack
      if (navigation && navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }

      // 3. If at root screen, require double tap within 2s to exit
      if (isRoot) {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPress.current = now;
        ToastAndroid.show('Press back again to exit OrderRestro', ToastAndroid.SHORT);
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [isRoot, onCloseModal, navigation]);
}
