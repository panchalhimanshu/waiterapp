import { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CommonHeader } from '@/components/CommonHeader';
import CallFor from '@/utilities/CallFor';
// import { RoleId } from "@/hooks/remixData";
import StatusMapper from "@/utilities/StatusMapper";
import { Switch } from 'react-native';
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setError(false); // Reset error state
      const response = await CallFor(`orders/${id}`, "get", null, "Auth");
      if (response.data.success) {
        setOrderData(response.data.data);
      } else {
        setError(true); // Set error if API returns failure
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(true); // Set error on exception
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleMarkAsServed = async (oitemsid: any, currentStatus: any) => {
    try {
      const newStatus = currentStatus == "49" ? 26 : 49;
      
      // Immediately update UI
      setOrderData(prevData => ({
        ...prevData,
        orderitems: prevData.orderitems.map((item : any) => 
          item.oitemsid === oitemsid 
            ? { ...item, orderitem_status: newStatus.toString() }
            : item
        )
      }));

      const response = await CallFor(
        `orders/items/${oitemsid}/status`,
        'POST',
        JSON.stringify({ status: newStatus }),
        'Auth'
      );
      
      if (!response.data.success) {
        // Revert if API call fails
        setOrderData(prevData  => ({
          ...prevData,
          orderitems: prevData.orderitems.map((item : any) => 
            item.oitemsid === oitemsid 
              ? { ...item, orderitem_status: currentStatus.toString() }
              : item
          )
        }));
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <CommonHeader 
        title={error ? "Error Loading Order" : "Order Details"}
        showBack 
        onBack={() => router.back()}
      /> 

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrderDetails();
            }}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>
              Failed to load order details. Please try again.
            </ThemedText>
          </View>
        ) : (
          orderData && (
            <>
              <View style={styles.header}>
                <View>
                  {/* <ThemedText style={styles.title}>Customer Order Details</ThemedText> */}
                  <View style={styles.orderInfo}>
                  <TouchableOpacity     style={styles.backButton}   onPress={() => router.back()}>
            <IconSymbol name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>  <ThemedText>Order Id: {orderData?.orderid}</ThemedText>
                    {orderData?.table_name && (
                      <ThemedText>Table No: {orderData?.table_name}</ThemedText>
                    )}
                  </View>
                </View>
                <StatusMapper.StatusBadge statusCode={orderData?.orderstatus} />
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <ThemedText style={styles.label}>Customer Name</ThemedText>
                  <TextInput
                    value={orderData.customer_name}
                    editable={false}
                    style={styles.input}
                  />
                </View>

                <View style={styles.detailItem}>
                  <ThemedText style={styles.label}>Order Type</ThemedText>
                  <TextInput
                    value={orderData.serving_type == 33 ? "Dine in" : "Take away"}
                    editable={false}
                    style={styles.input}
                  />
                </View>

                <View style={styles.detailItem}>
                  <ThemedText style={styles.label}>Date & Time</ThemedText>
                  <TextInput
                    value={new Date(orderData.orderdate).toLocaleString()}
                    editable={false}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Items List */}
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <ThemedText style={[styles.tableCell, styles.headerCell]}>Items</ThemedText>
                  <ThemedText style={[styles.tableCell, styles.headerCell]}>Status</ThemedText>
                  <ThemedText style={[styles.tableCell, styles.headerCell]}>Qty</ThemedText>
                  <ThemedText style={[styles.tableCell, styles.headerCell]}>Amount</ThemedText>
                </View>

                {orderData.orderitems.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 2 }]}>
                      <ThemedText>{item.itemname}</ThemedText>
                      <ThemedText style={styles.variantText}>({item.variantname})</ThemedText>
                    </View>
                    <View style={[styles.tableCell, { flex: 2 }]}>
                      <View style={styles.statusContainer}>
                        <StatusMapper.StatusBadge statusCode={item.orderitem_status} />
                        {(item.orderitem_status == "26" || item.orderitem_status == "49") && 
                         orderData?.orderstatus != "31" && (
                          <Switch
                            value={item.orderitem_status === "49"}
                            onValueChange={() => handleMarkAsServed(item.oitemsid, item.orderitem_status)}
                            ios_backgroundColor="#F1C556"
                            trackColor={{ false: "#F1C556", true: "#20C06A" }}
                            thumbColor={"#FFFFFF"}
                          />
                        )}
                      </View>
                    </View>
                    <ThemedText style={[styles.tableCell, { flex: 1 }]}>x{item.itemqty}</ThemedText>
                    <ThemedText style={[styles.tableCell, { flex: 1 }]}>₹{item.itemgrossamt}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Total Section */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <ThemedText>Subtotal</ThemedText>
                  <ThemedText>₹{parseFloat(orderData.orderitemtotal).toFixed(2)}</ThemedText>
                </View>
                <View style={styles.totalRow}>
                  <ThemedText>Tax</ThemedText>
                  <ThemedText>₹{parseFloat(orderData.ordertaxtotal).toFixed(2)}</ThemedText>
                </View>
                <View style={[styles.totalRow, styles.finalTotal]}>
                  <ThemedText style={styles.boldText}>Total</ThemedText>
                  <ThemedText style={styles.boldText}>
                    ₹{parseFloat(orderData.ordertotal).toFixed(2)}
                  </ThemedText>
                </View>
              </View>

              {/* Generate Bill Button */}
              {orderData?.orderitems.every(
                (item) => item.orderitem_status == "49" || item.orderitem_status == "29"
              ) &&
                orderData?.orderitems.some(
                  (item) => item.orderitem_status == "49"
                ) &&
                orderData?.orderstatus != "31" && (
                  <TouchableOpacity 
                    style={styles.generateBillButton}
                  //   onPress={() => router.push({
                  //     pathname: RoleId == 2 
                  //       ? `/outletmanager/orderhistory/orderdbill/${orderid}`
                  //       : `/waiter/myorder/orderdbill/${orderid}`
                  //   })}
                  >
                    <ThemedText style={styles.generateBillText}>Generate Bill</ThemedText>
                  </TouchableOpacity>
              )}
            </>
          )
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  }, backButton: {
    marginRight: 5 ,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderInfo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  detailsGrid: {
    padding: 16,
    gap: 16,
  },
  detailItem: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  tableContainer: {
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  headerCell: {
    fontWeight: '500',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    padding: 4,
  },
  variantText: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalSection: {
    padding: 16,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  boldText: {
    fontWeight: 'bold',
  },
  generateBillButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 24,
    margin: 16,
    alignItems: 'center',
  },
  generateBillText: {
    color: '#fff',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#ff0000',
  },
}); 