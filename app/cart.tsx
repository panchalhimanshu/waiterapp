import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCart } from '@/context/CartContext';
import CallFor from '@/utilities/CallFor';
import { useAuth } from '@/utilities/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalPropperties from '@/utilities/GlobalPropperties';

export default function CartScreen() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, addToCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authData } = useAuth();
  const [responseData, setResponseData] = useState({
    bookingId: '',
    tableId: '',
    uid: ''
  });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [nameError, setNameError] = useState('');
  const [mobileNumberError, setMobileNumberError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [originalOrderData, setOriginalOrderData] = useState(null);
  const [orderNote, setOrderNote] = useState("");
  const [showOrderNoteInput, setShowOrderNoteInput] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Add useEffect to fetch stored values when component mounts
  useEffect(() => {
    const fetchResponseData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('responseData');
        if (storedData) {
          setResponseData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error('Error fetching response data:', error);
      }
    };

    fetchResponseData();
  }, []);

  // Add useEffect to check if we're editing an order
  useEffect(() => {
    const checkEditingOrder = async () => {
      try {
        const orderId = await AsyncStorage.getItem('editingOrderId');
        setEditingOrderId(orderId);
      } catch (error) {
        console.error('Error checking editing order:', error);
      }
    };

    checkEditingOrder();
  }, []);

  // Add useEffect to fetch original order data when editing
  useEffect(() => {
    const fetchOriginalOrder = async () => {
      try {
        const orderId = await AsyncStorage.getItem('editingOrderId');
        if (orderId) {
          const response = await CallFor(`orders/${orderId}`, 'GET', null, "Auth");
          if (response.data.success) {
            setOriginalOrderData(response.data.data);
            setOrderNote(response.data.data.ordernote);
          }
        }
      } catch (error) {
        console.error('Error fetching original order:', error);
      }
    };

    fetchOriginalOrder();
  }, []);

  // Modified useEffect for customer search
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Search whenever mobileNumber changes and has 4 or more digits
    if (mobileNumber && mobileNumber.length >= 4) {
      const timeoutId = setTimeout(() => {
        handleCustomerSearch(mobileNumber);
      }, 300);
      setSearchTimeout(timeoutId);
    } else if (mobileNumber && mobileNumber.length < 4) {
      // Clear results when number is less than 4 digits
      setSearchResults([]);
    }

    // Cleanup timeout on unmount or when mobileNumber changes
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [mobileNumber]); // Trigger on every mobileNumber change

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = parseFloat(item.price) * parseFloat(item.quantity);
      const attributesTotal = (item.attributes || []).reduce((sum, attr) => sum + (attr.price || 0), 0);
      return total + itemTotal + (attributesTotal * parseFloat(item.quantity));
    }, 0);
  };

  const calculateTax = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = parseFloat(item.price) * parseFloat(item.quantity);
      const attributesTotal = (item.attributes || []).reduce((sum, attr) => sum + (attr.price || 0), 0);
      const totalBeforeTax = itemTotal + (attributesTotal * parseFloat(item.quantity));
      return total + (totalBeforeTax * (parseFloat(item.taxPercentage) / 100));
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const grandTotal = subtotal + tax;

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!editingOrderId && !responseData.uid) {
      setShowCustomerModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const currentDate = new Date().toISOString();
      const subtotal = calculateSubtotal();
      const taxTotal = calculateTax();
      const total = subtotal + taxTotal;

      let response;
      if (editingOrderId && originalOrderData) {
        // Prepare order items for edit
        const orderItems = cartItems.map(item => {
          const originalItem = originalOrderData?.orderitems?.find(
            oi => oi.proid == item.productId && oi.pvid == item.variantId
          );

          return {
            oitemsid: originalItem?.oitemsid || "0",
            orderid: editingOrderId || "0",
            proid: item.productId,
            pvid: item.variantId,
            reqdeliverydate: currentDate,
            expdeliverydate: currentDate,
            itemuom: "0",
            itemuomcfactor: "0",
            itemselecteduom: "0",
            itemqty: parseInt(item.quantity),
            deliveredqty: "0",
            recivedqty: "0",
            itemrate: item.price.toString(),
            itemamount: (parseFloat(item.price) * item.quantity).toFixed(2),
            itemtaxrate: item.taxPercentage.toString(),
            itemtaxamount: parseFloat((parseFloat(item.price) * item.quantity * (item.taxPercentage / 100)).toFixed(2)),
            itemgrossamt: parseFloat(((parseFloat(item.price) * item.quantity) * (1 + (item.taxPercentage / 100))).toFixed(2)),
            itemnote: "",
            ledgerid: "0",
            isdeleted: false,
            createdby: "17",
            createddate: currentDate,
            modifiedby: null,
            modifieddate: null,
            deletedby: null,
            deleteddate: null,
            isapproved: null,
            approvedby: null,
            approveddate: null,
            orderitem_status: originalItem?.orderitem_status || item.orderItemStatus || "28",
            itemname: item.name,
            orderitemDetailsModel: item.attributes.map(attr => {
              const originalAttr = originalItem?.orderitemDetailsModel?.find(
                oa => oa.attributeid == attr.attributeId && oa.avid == attr.id
              );

              return {
                attributeid: attr.attributeId,
                avid: attr.id,
                attributename: attr.name,
                avname: originalAttr?.avname || attr.value || ""
              };
            })
          };
        });

        const orderData = {
          orderid: editingOrderId,
          ordertype: false,
          isfa: false,
          uoid: "50",
          orderno: 0,
          otherpartyorderno: "",
          orderseriesid: "0",
          orderdate: currentDate,
          orderstatus: "30",
          orderterms: "0",
          orderremarks: "",
          ordernote: orderNote || null,
          orderjurisidiction: "",
          ordersupplystate: "0",
          orderstate: "0",
          orderitemtotal: subtotal.toFixed(2),
          ordertaxtotal: taxTotal.toFixed(2),
          orderledgertotal: "0",
          orderdiscount: "0",
          ordertotal: total.toFixed(2),
          ordertaxrate: originalOrderData.ordertaxrate || 22,
          deliverydate: currentDate,
          buyerid: originalOrderData.buyerid,
          sellerid: originalOrderData.sellerid,
          consigneeid: "0",
          promocode: "",
          discpercentage: "0",
          discamount: "0",
          discbasis: "0",
          ordertandc: "",
          ordersource: "0",
          ordercampaign: "0",
          orderdeliverfrom: "1",
          orderdeliverto: "0",
          shippingruleid: "0",
          isinternalorder: true,
          isdeleted: false,
          createdby: "17",
          createddate: currentDate,
          modifiedby: null,
          modifieddate: null,
          deletedby: null,
          deleteddate: null,
          isapproved: null,
          approvedby: null,
          approveddate: null,
          paymentstatus: null,
          shippingstatus: null,
          materialrequestid: null,
          table_id: originalOrderData.table_id,
          booking_id: originalOrderData.booking_id,
          serving_type: originalOrderData.serving_type,
          orderitems: orderItems,
          ordertaxdetails: [{
            orderid: editingOrderId,
            ordertaxtypeid: "0",
            ordertaxbasis: "0",
            ledgerid: "0",
            ordertaxrate: null,
            ordertaxableamount: subtotal.toFixed(2),
            ordertaxamount: taxTotal.toFixed(2),
            isdeleted: false,
            createdby: "17",
            createddate: currentDate,
            modifiedby: null,
            modifieddate: null,
            deletedby: null,
            deleteddate: null,
            isapproved: null,
            approvedby: null,
            approveddate: null
          }],
          ordersalescommisions: []
        };

        response = await CallFor(`orders/${editingOrderId}`, 'PUT', orderData, "Auth");
      } else {
        // Original new order creation logic
        const orderData = {
          ordertype: false,
          isfa: false,
          isinternalorder: true,
          orderno: 0,
          otherpartyorderno: "",
          orderseriesid: 0,
          orderdate: currentDate,
          orderstatus: 0,
          orderterms: 0,
          orderremarks: "",
          ordernote: orderNote || "",
          orderjurisidiction: "",
          ordersupplystate: 0,
          orderstate: 0,
          orderitemtotal: subtotal,
          ordertaxtotal: taxTotal,
          orderledgertotal: 0,
          orderdiscount: 0,
          ordertotal: total,
          ordertaxrate: 0,
          deliverydate: currentDate,
          buyerid: responseData.uid ? parseInt(responseData.uid) : 0,
          sellerid: authData.userData.uid,
          consigneeid: 0,
          promocode: "",
          discpercentage: 0,
          discamount: 0,
          discbasis: 0,
          ordertandc: "",
          ordersource: 0,
          ordercampaign: 0,
          orderdeliverfrom: "1",
          orderdeliverto: 0,
          shippingruleid: 0,
          table_id: responseData.tableId ? parseInt(responseData.tableId) : 0,
          booking_id: responseData.bookingId ? parseInt(responseData.bookingId) : 0,
          Serving_type: responseData.tableId ? 33 : 34,
          orderitems: cartItems.map(item => ({
            proid: item.productId,
            pvid: item.variantId,
            itemqty: parseInt(item.quantity),
            itemrate: item.price,
            itemtaxrate: item.taxPercentage,
            itemname: item.name,
            orderitemDetailsModel: item.attributes.map(attr => ({
              attributeid: attr.attributeId,
              avid: attr.id,
              attributename: attr.name,
              avname: attr.value || ""
            }))
          })),
          ordertaxdetails: [{
            ordertaxtypeid: 0,
            ordertaxbasis: 0,
            ledgerid: 0,
            ordertaxrate: null,
            ordertaxableamount: subtotal,
            ordertaxamount: taxTotal
          }],
          ordersalescommisions: []
        };

        response = await CallFor('orders', 'POST', orderData, "Auth");
      }

      if (!response.data.success) {
        throw new Error('Failed to submit order');
      }

      clearCart();
      await AsyncStorage.removeItem('editingOrderId');
      await AsyncStorage.removeItem('responseData');

      router.replace('/ordermenu');
      Alert.alert('Success', editingOrderId ? 'Order has been updated successfully!' : 'Order has been created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit order. Please try again.');
      console.error('Order submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update handleCustomerSearch to handle empty results
  const handleCustomerSearch = async (searchTerm) => {
    try {
      const response = await CallFor(
        `users/search-customer/${searchTerm}`,
        "GET",
        null,
        "Auth"
      );
      if (response.data.success) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleSaveCustomerDetails = async () => {
    setNameError("");
    setMobileNumberError("");

    // Validate mobile number
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      setMobileNumberError("Mobile number must be exactly 10 digits.");
      return;
    }

    // If a customer was selected from search results, use their ID
    if (selectedCustomer) {
      setResponseData(prev => ({
        ...prev,
        uid: selectedCustomer.uid
      }));
      await AsyncStorage.setItem('responseData', JSON.stringify({
        ...responseData,
        uid: selectedCustomer.uid
      }));
      setShowCustomerModal(false);
      return;
    }

    try {
      const customerResponse = await CallFor(
        "users/customer",
        "POST",
        JSON.stringify({
          fullname: customerName,
          mobno: mobileNumber,
        }),
        "Auth"
      );

      if (customerResponse.data.success) {
        setResponseData(prev => ({
          ...prev,
          uid: customerResponse.data.data.uid
        }));
        await AsyncStorage.setItem('responseData', JSON.stringify({
          ...responseData,
          uid: customerResponse.data.data.uid
        }));
        setShowCustomerModal(false);
      }
    } catch (error) {
      console.error('Error saving customer details:', error);
      // Check for specific error type indicating duplicate mobile number
      if (error.response?.data?.data?.error?.code == "UNIQUE_VIOLATION" || 
          error.response?.data?.data?.error?.details?.code == "P2002") {
        setMobileNumberError("This mobile number is already registered");
        Alert.alert('Error', 'This mobile number is already registered');
      } else {
        Alert.alert('Error', 'Failed to save customer details. Please try again.');
      }
    }
  };

  const handleCancelEdit = async () => {
    // Show confirmation alert
    Alert.alert(
      "Cancel Edit",
      "Are you sure you want to cancel editing this order?",
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => {} // Empty function to just dismiss the alert
        },
        {
          text: "Yes",
          onPress: async () => {
            // Clear cart and editing state
            clearCart();
            await AsyncStorage.removeItem('editingOrderId');
            await AsyncStorage.removeItem('responseData');
            // Navigate back to order menu
            router.replace('/ordermenu');
          }
        }
      ],
      { cancelable: true } // Allows dismissing by tapping outside
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace('/ordermenu')}>
          <IconSymbol name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Cart</Text>
        {editingOrderId && (
          <TouchableOpacity 
            style={styles.cancelEditButton}
            onPress={handleCancelEdit}
          >
            <Text style={styles.cancelEditText}>Cancel Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={styles.content}>
        {/* <Text style={styles.sectionTitle}>My Order</Text> */}
        
        {cartItems.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Text style={styles.emptyCartText}>No items in cart</Text>
          </View>
        ) : (
          <>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                {item.image && (
                  <Image 
                    source={{ 
                      uri: item.image.startsWith('http') 
                        ? item.image 
                        : `${GlobalPropperties.viewdocument}${item.image}` 
                    }}
                    style={styles.itemImage}
                  />
                )}
                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => {
                          if (item.quantity <= 1) {
                            removeFromCart(item.id);
                          } else {
                            updateQuantity(item.id, parseInt(item.quantity) - 1);
                          }
                        }}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.itemQuantity}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, parseInt(item.quantity) + 1)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                  </View>
                  {item.variant && (
                    <Text style={styles.variantName}>Variant: {item.variant}</Text>
                  )}
               <Text>Customize : </Text> {item.attributes?.map((attr, index) => (
                    <View key={index} style={styles.attributeRow}> 
                    <Text style={styles.attributeName}> {attr.name}</Text>
                      <Text style={styles.attributePrice}>
                        {attr.price > 0 ? `₹${attr.price}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.actionRow}>
              {showOrderNoteInput ? (
                <View style={styles.orderNoteInputContainer}>
                  <TextInput
                    style={styles.orderNoteInput}
                    placeholder="Enter order note"
                    value={orderNote}
                    onChangeText={setOrderNote}
                    onBlur={() => {
                      if (!orderNote.trim()) {
                        setShowOrderNoteInput(false);
                      }
                    }}
                    autoFocus
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.orderNoteButton}
                  onPress={() => setShowOrderNoteInput(true)}
                >
                  <Text style={styles.orderNoteButtonText}>
                    {orderNote ? orderNote : "Order Note"}
                  </Text>
                </TouchableOpacity>
              )}

                <TouchableOpacity 
                  style={styles.addNewItemButton}
                  onPress={() => router.push('/ordermenu')}
                >
                  <IconSymbol name="add" size={20} color="#fff" />
                  <Text style={styles.addNewItemText}>Add New Item</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text>Subtotal</Text>
                <Text>₹{calculateSubtotal().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Tax</Text>
                <Text>₹{calculateTax().toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.grandTotal]}>
                <Text style={styles.grandTotalText}>Grand Total</Text>
                <Text style={styles.grandTotalText}>
                  ₹{(calculateSubtotal() + calculateTax()).toFixed(2)}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.tableInfo}>
          {/* <Text style={styles.guestText}>Guest - 2</Text> */}
          {responseData.tableId  ?  <Text style={styles.tableText}>Table No. - {responseData.tableId ? responseData.tableId : 0}</Text> : <Text style={styles.tableText}>Take Away</Text>}
        </View>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitOrder}
          disabled={isSubmitting || cartItems.length === 0}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Confirm Order' : 'Confirm Order'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCustomerModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <IconSymbol name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text>Phone Number</Text>
              <View style={[styles.inputWrapper, mobileNumberError && styles.inputError]}>
                <IconSymbol name="phone" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Phone Number"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {mobileNumberError ? <Text style={styles.errorText}>{mobileNumberError}</Text> : null}
            </View>

            {searchResults.length > 0 && !selectedCustomer && (
              <ScrollView style={styles.customerList}>
                {searchResults.map((customer) => (
                  <TouchableOpacity
                    key={customer.uid}
                    style={styles.customerItem}
                    onPress={() => {
                      setSelectedCustomer(customer);
                      setCustomerName(customer.fullname);
                      setMobileNumber(customer.mobno);
                      setSearchResults([]);
                    }}
                  >
                    <Text style={styles.customerName}>
                      {customer.fullname}
                    </Text>
                    <Text style={styles.customerPhone}>
                      {customer.mobno}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.inputContainer}>
              <Text>Customer Name</Text>
              <View style={[styles.inputWrapper, nameError && styles.inputError]}>
                <IconSymbol name="person" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Customer Name"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCustomerModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveCustomerDetails}
              >
                <Text style={styles.saveButtonText}>Save Details</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'green',

  },
  itemQuantity: {
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  itemPrice: {
    fontWeight: '500',
  },
  variantName: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  attributeRow: {
    flexDirection: 'row',
    flexWrap:'nowrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  attributeName: {
    color: '#666',
    fontSize: 14,
  },
  attributePrice: {
    color: '#666',
    fontSize: 14,
  },
  summary: {
    borderRadius:10,
    padding: 16,
    backgroundColor: '#f9f9f9',
    margin: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  grandTotalText: {
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tableInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  guestText: {
    color: '#666',
  },
  tableText: {
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    position: 'relative',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#000',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  customerList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
  },
  customerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cancelEditButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  cancelEditText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 15,
    gap: 12,
  },
  orderNoteButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  orderNoteButtonText: {
    color: '#666',
    fontSize: 14,
  },
  orderNoteInputContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  orderNoteInput: {
    padding: 12,
    fontSize: 14,
  },
  addNewItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    minWidth: 140,
  },
  addNewItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 