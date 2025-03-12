import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusMapper = {
  // Status code to text mapping (unchanged)
  getStatusText: (statusCode: string) => {
    const statusMap = {
      "26": "Ready to Serve",
      "27": "Preparing",
      "28": "Waiting",
      "29": "Cancelled",
      "49": "Served",
      "30": "Active",
      "31": "Completed",
      "32": "Cancelled"
    };
    return statusMap[statusCode as keyof typeof statusMap] || "Unknown";
  },

  // Get status style objects for React Native
  getStatusStyles: (statusCode: string) => {
    const styleMap = {
      "26": {
        container: { backgroundColor: '#DEF7EC' },
        text: { color: '#03543F' }
      },
      "27": {
        container: { backgroundColor: '#FEF3C7' },
        text: { color: '#92400E' }
      },
      "28": {
        container: { backgroundColor: '#DBEAFE' },
        text: { color: '#1E40AF' }
      },
      "29": {
        container: { backgroundColor: '#FEE2E2' },
        text: { color: '#991B1B' }
      },
      "49": {
        container: { backgroundColor: '#005000' },
        text: { color: '#FFFFFF' }
      },
      "30": {
        container: { backgroundColor: '#DEF7EC' },
        text: { color: '#03543F' }
      },
      "31": {
        container: { backgroundColor: '#DBEAFE' },
        text: { color: '#1E40AF' }
      },
      "32": {
        container: { backgroundColor: '#FEE2E2' },
        text: { color: '#991B1B' }
      }
    };
    
    return styleMap[statusCode as keyof typeof styleMap] || {
      container: { backgroundColor: '#F3F4F6' },
      text: { color: '#1F2937' }
    };
  },

  // Status Badge Component for React Native
  StatusBadge: ({ statusCode , style = {} }) => {
    const statusStyles = StatusMapper.getStatusStyles(statusCode);
    
    return (
      <View style={[styles.badge, statusStyles.container, style]}>
        <Text style={[styles.badgeText, statusStyles.text]}>
          {StatusMapper.getStatusText(statusCode)}
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default StatusMapper; 