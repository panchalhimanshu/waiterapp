import { StyleSheet, View, Text, TouchableOpacity, FlatList, Switch, RefreshControl, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { CommonHeader } from '@/components/CommonHeader';
// import { SearchBar } from '@/components/SearchBar';
import { router } from 'expo-router';
import CallFor from "@/utilities/CallFor";
// import { RoleId, Uid } from "../hooks/remixData";
import StatusMapper from "@/utilities/StatusMapper";
import { useAuth } from '@/utilities/AuthContext';

export default function OrdersScreen() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [visibleItems, setVisibleItems] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const { authData } = useAuth();
  const tabs = ["All", "Active", "Completed", "Cancelled"];
  const tabStatusMap = {
    0: null,
    1: 30,
    2: 31,
    3: 32
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    const today = new Date();
    const todayISO = today.toISOString().split("T")[0];

    try {
      const response = await CallFor(
        'orders/filter',
        'POST',
        JSON.stringify({
          serving_type: null,
          ordertype: false,
          order_date_from: todayISO,
          order_date_to: "",
          sellerid: authData.userData.uid,
          order_status: tabStatusMap[selectedTab],
          page: 1,
          limit: 10000,
        }),
        'Auth'
      );

      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch orders');
      }

      setOrders(response?.data?.data?.orders || []);
      setHasMore(response?.data?.data?.orders?.length === 15);
      
    } catch (error) {
      console.error(error);
      setError('Failed to fetch order data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchOrders();
  }, [selectedTab]);

  const handleMarkAsServed = async (oitemsid: any, currentStatus: any) => {
    try {
      const newStatus = currentStatus == "49" ? 26 : 49;
      
      // Immediately update UI for better user experience
      setOrders((prevOrders : any) => 
        prevOrders.map((order : any) => ({
          ...order,
          orderitems: order.orderitems.map((item : any) => {
            if (item.oitemsid === oitemsid) {
              return {
                ...item,
                orderitem_status: newStatus.toString()
              };
            }
            return item;
          })
        }))
      );

      // Then make the API call
      const response = await CallFor(
        `orders/items/${oitemsid}/status`,
        'POST',
        JSON.stringify({ status: newStatus }),
        'Auth'
      );
      
      // If API call fails, revert the change
      if (!response.data.success) {
        setOrders((prevOrders : any) => 
            prevOrders.map((order : any) => ({
            ...order,
            orderitems: order.orderitems.map((item : any) => {
              if (item.oitemsid == oitemsid) {
                return {
                  ...item,
                  orderitem_status: currentStatus.toString()
                };
              }
              return item;
            })
          }))
        );
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      // Revert changes on error
      setOrders((prevOrders : any) => 
        prevOrders.map((order : any) => ({
          ...order,
          orderitems: order.orderitems.map((item : any) => {
            if (item.oitemsid === oitemsid) {
              return {
                ...item,
                orderitem_status: currentStatus.toString()
              };
            }
            return item;
          })
        }))
      );
    }
  };

  const renderOrderItem = ({ item: order }: { item: any }) => (
    <ThemedView style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <ThemedText style={styles.orderType}>
            {order?.serving_type == "33" ? "Dine-In" : "Take away"}
          </ThemedText>
          <ThemedText style={styles.orderInfo}>
            T.No--1st {order?.table_name ?? "0"} #{order?.orderid}
          </ThemedText>
          <ThemedText style={styles.dateText}>
            {new Date(order.orderdate).toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.statusContainer}>
          <StatusMapper.StatusBadge statusCode={order.orderstatus} />
        </View>
      </View>

      <FlatList
        data={order?.orderitems.slice(0, visibleItems[order?.orderid as any] || 4)}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <ThemedText style={styles.itemName}>{item?.itemname}</ThemedText>
            <ThemedText style={styles.itemQty}>{item?.itemqty}</ThemedText>
            <View style={styles.itemStatus}>
              <StatusMapper.StatusBadge statusCode={item.orderitem_status} />
            </View>
            {(item.orderitem_status == "26" || item.orderitem_status == "49") && 
              order?.orderstatus != "31" && (
              <Switch
                value={item.orderitem_status == "49"}
                onValueChange={() => handleMarkAsServed(item.oitemsid, item.orderitem_status)}
                ios_backgroundColor="#F1C556"
                trackColor={{ false: "#F1C556", true: "#20C06A" }}
                thumbColor={"#FFFFFF"}
              />
            )}
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        scrollEnabled={false}
      />

      {order?.orderitems.length > 4 && (
        <TouchableOpacity
          onPress={() => {
            setVisibleItems((prev) => ({
              ...prev,
              [order?.orderid]:
                (prev[order?.orderid] || 4) === 4
                  ? order?.orderitems.length
                  : 4,
            }))
          }}
          style={styles.seeMoreButton}
        >
          <ThemedText style={styles.seeMoreText}>
            {visibleItems[order?.orderid] > 4 ? "See Less" : "See More"}
          </ThemedText>
        </TouchableOpacity>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            console.log("Navigating to order details:", order.orderid);
            router.push({
              pathname: "/(details)/[id]",
              params: { id: order.orderid }
            });
          }}>
          <ThemedText style={styles.buttonText}>See Detail</ThemedText>
        </TouchableOpacity>
        
        {order?.orderstatus != "32" && (
          <TouchableOpacity 
            style={styles.secondaryButton}
          >
            <ThemedText style={styles.buttonText}>
              {order?.orderstatus == "31" ? "Print Bill" : "Edit Order"}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <CommonHeader title="Today Orders" />
      
      {/* <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search orders..."
      /> */}

      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        <View style={styles.tabs}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedTab(index)}
              style={styles.tabButton}
            >
              <ThemedText style={selectedTab === index ? styles.activeTab : styles.inactiveTab}>
                {tab}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => index.toString()}
        onEndReached={() => {
          if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchOrders(nextPage);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setPage(1);
              fetchOrders(1);
            }}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orderCard: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderType: {
    fontWeight: '600',
    fontSize: 16,
  },
  orderInfo: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabsContainer: {
    flexGrow: 0,
    marginVertical: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tabButton: {
    marginRight: 32,
  },
  activeTab: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 8,
  },
  inactiveTab: {
    fontSize: 16,
    color: '#666',
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    flex: 2,
  },
  itemQty: {
    flex: 1,
    textAlign: 'center',
  },
  itemStatus: {
    flex: 1,
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  seeMoreButton: {
    marginTop: 8,
    padding: 8,
  },
  seeMoreText: {
    color: '#007AFF',
  },
  statusContainer: {
    padding: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
