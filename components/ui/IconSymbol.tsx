// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
   'dashboard':'dashboard',
   'camera':'camera',
   'edit':'edit',
   'close':'close',
  'menu':'menu',
  'arrow-back': 'arrow-back',
  'search': 'search',
  'storefront.circle.fill.fill': 'store',
  'envelope': 'email',
  'lock': 'lock',
  'lock.fill': 'lock',
  'envelope.fill': 'email',
  'envelope.circle.fill': 'email',
  'envelope.circle': 'email',
  'envelope.open.fill': 'email',
  'envelope.open': 'email',
  'cart.fill': 'shopping-cart',
  'cart': 'shopping-cart',
  'cart.circle.fill': 'shopping-cart',
  'cart.circle': 'shopping-cart',
  'cart.badge.plus': 'add-shopping-cart',
  'cart.badge.minus': 'remove-shopping-cart',
  'cart.badge.minus.fill': 'remove-shopping-cart',
  'gear.fill': 'settings',
  'star.fill': 'star',
  'star': 'star-border',
  'star.lefthalf.fill': 'star-half',
  'star.circle.fill': 'star-border',
  'star.circle': 'star-border',
  'bell.fill': 'notifications',
  "notifications": "notifications",
  'bell': 'notifications-none',
  'person.fill': 'person',
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'tablerestaurant': 'table-restaurant',
  'restaurant': 'restaurant',
  'ordered': 'list',
  'phone': 'phone',
  'person': 'person',
 
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
