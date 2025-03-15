import React, { createContext, useContext, useState } from 'react';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: string | number;
  variant: string;
  variantId: string;
  taxPercentage: number;
  attributes: Array<{
    id: string;
    attributeId: string;
    name: string;
    price: number;
  }>;
  isExistingItem?: boolean;
  orderItemStatus?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const areItemsEqual = (item1: CartItem, item2: CartItem) => {
    // Check if product and variant IDs match
    if (item1.productId != item2.productId || item1.variantId != item2.variantId) {
      return false;
    }

    // Check if attributes are the same
    if (item1.attributes.length != item2.attributes.length) {
      return false;
    }

    // Sort attributes to ensure consistent comparison
    const attrs1 = [...item1.attributes].sort((a, b) => a.id.localeCompare(b.id));
    const attrs2 = [...item2.attributes].sort((a, b) => a.id.localeCompare(b.id));

    // Compare each attribute
    return attrs1.every((attr, index) => 
      attr.id == attrs2[index].id && 
      attr.attributeId == attrs2[index].attributeId
    );
  };

  const addToCart = (newItem: CartItem) => {
    setCartItems(prevItems => {
      // Find existing items with same product, variant, and attributes
      const existingItems = prevItems.filter(item => areItemsEqual(item, newItem));

      if (existingItems.length > 0) {
        // Find item with status 28 (if exists)
        const pendingItem = existingItems.find(item => item.orderItemStatus == "28");

        if (pendingItem) {
          // If there's a pending item, update its quantity
          return prevItems.map(item => 
            item.id == pendingItem.id
              ? { ...item, quantity: parseInt(item.quantity) + parseInt(newItem.quantity) }
              : item
          );
        }
      }

      // If no pending item found or no matching items, add as new item with status 28
      return [...prevItems, { 
        ...newItem, 
        orderItemStatus: "28",
        isExistingItem: false,
        id: Math.random().toString() // Generate new ID for new items
      }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id != itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id == itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity,
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 