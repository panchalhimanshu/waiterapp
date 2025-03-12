import { Tabs, useRouter, usePathname } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();

  const shouldShowTabBar = pathname != '/';

  const getScreenKey = (name: string) => `${name}-${pathname == `/${name}` ? 'active' : 'inactive'}`;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666666',
        headerShown: false,
        tabBarButton: (props) => (
          <HapticTab 
            {...props}
            style={[
              styles.tab,
              props.accessibilityState?.selected && styles.activeTab
            ]}
          />
        ),
        tabBarBackground: TabBarBackground,
        tabBarStyle: shouldShowTabBar ? {
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        } : { display: 'none' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          tabBarStyle: { display: 'none' },
          href: null,
        }}
        key={getScreenKey('index')}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Tables',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="tablerestaurant" color={color} />,
        }}
        key={getScreenKey('tables')}
      />
      <Tabs.Screen
        name="ordermenu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="restaurant" color={color} />,
        }}
        key={getScreenKey('ordermenu')}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="ordered" color={color} />,
        }}
        key={getScreenKey('orders')}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 1 }],
    transition: 'all 0.2s ease',
  },
  activeTab: {
    transform: [{ scale: 1.1 }],
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
