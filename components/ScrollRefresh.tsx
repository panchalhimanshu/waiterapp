import React from 'react';
import { ScrollView, RefreshControl, ScrollViewProps } from 'react-native';

interface ScrollRefreshProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}

export const ScrollRefresh: React.FC<ScrollRefreshProps> = ({
  refreshing,
  onRefresh,
  children,
  ...props
}) => {
  return (
    <ScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
          tintColor="#4CAF50"
        />
      }
    >
      {children}
    </ScrollView>
  );
};

// FlatList version of the component
import { FlatList, FlatListProps } from 'react-native';

interface FlatListRefreshProps<T> extends Omit<FlatListProps<T>, 'refreshControl'> {
  refreshing: boolean;
  onRefresh: () => void;
}

export const FlatListRefresh = <T,>({
  refreshing,
  onRefresh,
  ...props
}: FlatListRefreshProps<T>) => {
  return (
    <FlatList
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
          tintColor="#4CAF50"
        />
      }
    />
  );
}; 