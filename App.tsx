import { CartProvider } from '@/context/CartContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CartProvider>
        {/* Your existing app content */}
      </CartProvider>
      <Toast />
    </GestureHandlerRootView>
  );
} 