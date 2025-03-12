import { CartProvider } from '@/context/CartContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CartProvider>
        {/* Your existing app content */}
      </CartProvider>
    </GestureHandlerRootView>
  );
} 