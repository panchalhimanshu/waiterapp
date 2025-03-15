import { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, RefreshControl, Modal, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CommonHeader } from '@/components/CommonHeader';
import CallFor from '@/utilities/CallFor';
// import { RoleId } from "@/hooks/remixData";
import StatusMapper from "@/utilities/StatusMapper";
import { Switch } from 'react-native';
import { IconSymbol } from "@/components/ui/IconSymbol";
import WebView from 'react-native-webview';
import { useCart } from '@/context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const [orderData, setOrderData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [isBillModalVisible, setBillModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [razorpayHTML, setRazorpayHTML] = useState('');
  const { clearCart, addToCart } = useCart();

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
          item.oitemsid == oitemsid 
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
            item.oitemsid == oitemsid 
              ? { ...item, orderitem_status: currentStatus.toString() }
              : item
          )
        }));
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      const razorpayHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body>
          <script>
            var options = {
              key: 'rzp_test_vv1FCZvuDRF6lQ',
              amount: ${Math.round(orderData?.ordertotal * 100)},
              currency: 'INR',
              name: 'Taj Hotel',
              description: 'Order #${orderData?.orderid}',
              prefill: {
                name: '${orderData?.customer_name || ''}',
                email: '',
                contact: ''
              },
              theme: {
                color: '#000000'
              },
              handler: function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify(response));
              },
              modal: {
                ondismiss: function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MODAL_CLOSED' }));
                }
              },
              notes: {
                order_id: '${orderData?.orderid}'
              }
            };
            
            try {
              var rzp = new Razorpay(options);
              rzp.on('payment.failed', function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PAYMENT_FAILED',
                  error: response.error
                }));
              });
              rzp.open();
            } catch (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                error: error.message
              }));
            }
          </script>
        </body>
        </html>
      `;

      setPaymentModalVisible(true);
      setRazorpayHTML(razorpayHTML);
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
    }
  };

  const handlePaymentResponse = async (event: any) => {
    try {
      const response = JSON.parse(event.nativeEvent.data);
      console.log('Payment Response:', response); // Add logging to debug

      if (response.razorpay_payment_id) {
        // Call your payment success handler
        const paymentUpdateResponse = await CallFor(
          `orders/${id}/status`,
          'put',
          {
            orderStatus: 31, // Completed status
            paymentStatus: 1, // Paid status
            paymentId: response.razorpay_payment_id,
            paymentMethod: 'card',
            paymentCompletedTime: new Date().toISOString()
          },
          'Auth'
        );

        if (paymentUpdateResponse.data.success) {
          Alert.alert('Success', 'Payment successful!');
          setBillModalVisible(false);
          // Optionally refresh order details
          fetchOrderDetails();
        } else {
          throw new Error('Failed to update order status');
        }
      } else {
        throw new Error('No payment ID received');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert(
        'Error',
        'Payment was processed but failed to update order. Please contact support.'
      );
    } finally {
      setPaymentModalVisible(false);
    }
  };

  const handleEditOrder = async () => {
    try {
      // Clear existing cart
      clearCart();

      // Add existing order items to cart
      orderData.orderitems.forEach(item => {
        // Only add items with status 28 (pending) as editable quantities
        const cartItem = {
          id: item.pvid,
          productId: item.proid,
          name: item.itemname,
          image: item.product_image?.url || '',
          quantity: item.itemqty,
          price: item.itemrate,
          variant: item.variantname,
          variantId: item.pvid,
          taxPercentage: parseFloat(item.itemtaxrate),
          attributes: item.orderitemDetailsModel.map(attr => ({
            id: attr.avid,
            attributeId: attr.attributeid,
            name: attr.avname,
            price: 0 // Add price if available in your data
          })),
          isExistingItem: true, // Flag to identify existing items
          orderItemStatus: item.orderitem_status // Add status to track editable items
        };
        addToCart(cartItem);
      });

      // Store order ID in AsyncStorage for reference
      await AsyncStorage.setItem('editingOrderId', orderData.orderid);

      // Navigate to cart
      router.push('/cart');
    } catch (error) {
      console.error('Error preparing cart for edit:', error);
      Alert.alert('Error', 'Failed to prepare order for editing');
    }
  };

  const BillModal = () => (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isBillModalVisible}
        onRequestClose={() => setBillModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.billHeader}>
              <ThemedText style={styles.restaurantName}>RESTAURANT</ThemedText>
              <ThemedText style={styles.hotelName}>Taj Hotel</ThemedText>
              <ThemedText style={styles.address}>Ahmedabad</ThemedText>
              <ThemedText style={styles.address}>Sindhu Bhavan-380009</ThemedText>
              <ThemedText style={styles.gstin}>GSTIN: 23AABFM0301H1ZH</ThemedText>
              <ThemedText style={styles.state}>State: Gujarat</ThemedText>
            </View>

            <View style={styles.billInfo}>
              <View style={styles.billInfoRow}>
                <ThemedText>Bill No: #{orderData?.orderid}</ThemedText>
                <ThemedText>Date: {new Date().toLocaleDateString()}</ThemedText>
              </View>
              <View style={styles.billInfoRow}>
                <ThemedText>Time: {new Date().toLocaleTimeString()}</ThemedText>
                <ThemedText>Table: {orderData?.table_name}</ThemedText>
              </View>
            </View>

            <View style={styles.billTable}>
              <View style={styles.tableHeader}>
                <ThemedText style={[styles.tableCell, { flex: 2 }]}>Description</ThemedText>
                <ThemedText style={[styles.tableCell, { flex: 1 }]}>Qty</ThemedText>
                <ThemedText style={[styles.tableCell, { flex: 1 }]}>Rate</ThemedText>
                <ThemedText style={[styles.tableCell, { flex: 1 }]}>Tax %</ThemedText>
                <ThemedText style={[styles.tableCell, { flex: 1 }]}>Tax Amt</ThemedText>
                <ThemedText style={[styles.tableCell, { flex: 1 }]}>Amount</ThemedText>
              </View>

              {orderData?.orderitems.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <ThemedText style={[styles.tableCell, { flex: 2 }]}>
                    {item.itemname}
                    <ThemedText style={styles.variantText}>
                      {'\n'}({item.variantname})
                    </ThemedText>
                  </ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 1 }]}>{item.itemqty}</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 1 }]}>₹{item.itemrate}</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 1 }]}>{item.itemtaxrate}%</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 1 }]}>₹{item.itemtaxamount}</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 1 }]}>₹{item.itemgrossamt}</ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.billSummary}>
              <View style={styles.summaryRow}>
                <ThemedText>Subtotal</ThemedText>
                <ThemedText>₹{parseFloat(orderData?.orderitemtotal).toFixed(2)}</ThemedText>
              </View>
              {orderData?.ordertaxdetails.map((tax, index) => (
                <View key={index} style={styles.summaryRow}>
                  <ThemedText>Tax ({orderData?.orderitems[0]?.itemtaxrate}%)</ThemedText>
                  <ThemedText>₹{parseFloat(tax.ordertaxamount).toFixed(2)}</ThemedText>
                </View>
              ))}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <ThemedText style={styles.totalText}>Total Amount</ThemedText>
                <ThemedText style={styles.totalText}>
                  ₹{parseFloat(orderData?.ordertotal).toFixed(2)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.paymentOptions}>
              <TouchableOpacity 
                style={styles.paymentButton}
                onPress={handleRazorpayPayment}
              >
                <ThemedText style={styles.paymentButtonText}>Pay with Card</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.paymentButton, styles.cashButton]}
                onPress={() => handlePaymentSuccess('cash_payment')}
              >
                <ThemedText style={styles.paymentButtonText}>Pay with Cash</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.goBackButton]} 
                onPress={() => setBillModalVisible(false)}
              >
                <IconSymbol name="arrow-back" size={20} color="#000" />
                <ThemedText style={styles.buttonText}>Go Back</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.printButton]}
                onPress={() => {
                  // Handle print functionality
                  setBillModalVisible(false);
                }}
              >
                <ThemedText style={[styles.buttonText, { color: '#fff' }]}>Print Bill</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <PaymentModal />
    </>
  );

  const PaymentModal = () => (
    <Modal
      visible={paymentModalVisible}
      onRequestClose={() => {
        Alert.alert(
          'Cancel Payment',
          'Are you sure you want to cancel the payment?',
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: () => setPaymentModalVisible(false),
            },
          ]
        );
      }}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <WebView
          source={{ html: razorpayHTML }}
          onMessage={handlePaymentResponse}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
            Alert.alert('Error', 'Failed to load payment interface');
            setPaymentModalVisible(false);
          }}
        />
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            Alert.alert(
              'Cancel Payment',
              'Are you sure you want to cancel the payment?',
              [
                {
                  text: 'No',
                  style: 'cancel',
                },
                {
                  text: 'Yes',
                  onPress: () => setPaymentModalVisible(false),
                },
              ]
            );
          }}
        >
          <ThemedText style={styles.closeButtonText}>Cancel Payment</ThemedText>
        </TouchableOpacity>
      </View>
    </Modal>
  );

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
                  <ThemedText style={[styles.tableCell, { flex: 2 }]}>Items</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 1 }]}>Qty</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 1 }]}>Amount</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 1.5 }]}>Status</ThemedText>
                </View>

                {orderData.orderitems.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 2 }]}>
                      <ThemedText>{item.itemname}</ThemedText>
                      <ThemedText style={styles.variantText}>({item.variantname})</ThemedText>
                    </View>
                    <ThemedText style={[styles.tableCell, { flex: 1 }]}>x{item.itemqty}</ThemedText>
                    <ThemedText style={[styles.tableCell, { flex: 1 }]}>₹{item.itemgrossamt}</ThemedText>
                    <View style={[styles.tableCell, { flex: 1.5 }]}>
                      <View style={styles.statusActionContainer}>
                        <View style={styles.statusWrapper}>
                          <StatusMapper.StatusBadge statusCode={item.orderitem_status} />
                          {(item.orderitem_status == "26" || item.orderitem_status == "49") && 
                           orderData?.orderstatus != "31" && (
                            <Switch
                              value={item.orderitem_status == "49"}
                              onValueChange={() => handleMarkAsServed(item.oitemsid, item.orderitem_status)}
                              ios_backgroundColor="#F1C556"
                              trackColor={{ false: "#F1C556", true: "#20C06A" }}
                              thumbColor={"#FFFFFF"}
                              style={styles.statusSwitch}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Total Section */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <ThemedText style={styles.totalLabel}>Subtotal</ThemedText>
                  <ThemedText style={styles.totalValue}>₹{parseFloat(orderData.orderitemtotal).toFixed(2)}</ThemedText>
                </View>
                <View style={styles.totalRow}>
                  <ThemedText style={styles.totalLabel}>Tax</ThemedText>
                  <ThemedText style={styles.totalValue}>₹{parseFloat(orderData.ordertaxtotal).toFixed(2)}</ThemedText>
                </View>
                <View style={[styles.totalRow, styles.finalTotal]}>
                  <ThemedText style={styles.grandTotalLabel}>Grand Total</ThemedText>
                  <ThemedText style={styles.grandTotalValue}>
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
                    onPress={() => setBillModalVisible(true)}
                  >
                    <ThemedText style={styles.generateBillText}>Generate Bill</ThemedText>
                  </TouchableOpacity>
              )}

              {/* Add Edit button if order status allows editing */}
              {orderData?.orderstatus == "30" && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={handleEditOrder}
                >
                  <IconSymbol name="edit" size={20} color="#fff" />
                  <ThemedText style={styles.editButtonText}>Edit Order</ThemedText>
                </TouchableOpacity>
              )}
            </>
          )
        )}
      </ScrollView>

      <BillModal />
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
    fontSize: 14,
    paddingHorizontal: 4,
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
    gap: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    color: '#666',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  generateBillButton: {
    backgroundColor: 'green',
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
  statusActionContainer: {
    alignItems: 'flex-start',
  },
  statusWrapper: {
    alignItems: 'center',
    gap: 4, // Space between status badge and switch
  },
  statusSwitch: {
    transform: [{ scale: 0.8 }], // Makes the switch slightly smaller
    marginTop: 2, // Additional space between status and switch
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  billHeader: {
    marginBottom: 20,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    marginBottom: 8,
  },
  gstin: {
    fontSize: 14,
    marginBottom: 8,
  },
  state: {
    fontSize: 14,
    marginBottom: 8,
  },
  billInfo: {
    marginBottom: 20,
  },
  billInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  billSummary: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalText: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12 ,
    paddingHorizontal:25,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  goBackButton: {
    backgroundColor: 'white',
  },
  printButton: {
    backgroundColor: 'green',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webview: {
    flex: 1,
  },
  closeButton: {
    padding: 16,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  paymentOptions: {
    marginTop: 20,
    gap: 10,
    paddingHorizontal: 16,
  },
  paymentButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cashButton: {
    backgroundColor: '#1976D2',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 