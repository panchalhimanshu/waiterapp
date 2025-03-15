import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useCart } from '@/context/CartContext';

interface CommonHeaderProps {
  title?: string;
  backgroundColor?: string;
  showBackButton?: boolean;
}

export const CommonHeader = ({ 
  title, 
  backgroundColor = '#2E7D32',
  showBackButton = false 
}: CommonHeaderProps) => {
  const { cartItems } = useCart();
  const cartItemCount = cartItems.length;

  const handleCartPress = () => {
    router.push('/cart');
  };

  const handleNotificationPress = () => {
    console.log('Notifications');
    // Implement notification handling
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <View style={[styles.header, { backgroundColor }]}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={handleProfilePress}
          >
            <IconSymbol name="person" size={24} color="#fff" />
          </TouchableOpacity>
          
        </View>
        <View style={styles.titleContainer}>
            {title && <Text style={styles.headerTitle}>{title}</Text>}
          </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.headerButton, styles.cartButton]}
            onPress={handleCartPress}
          >
            <View>
              <IconSymbol name="cart" size={24} color="#fff" />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartItemCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 55,
    paddingTop: 0,
    zIndex: 1000,
    backgroundColor: '#D0D0D0',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'semibold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingRight: 0,
  },
  headerButton: {
    padding: 8,
  },
  cartButton: {
    marginLeft: 0,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
}); 