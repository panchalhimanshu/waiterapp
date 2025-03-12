import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCart } from '@/context/CartContext';
import CallFor from '@/utilities/CallFor';
import { useAuth } from '@/utilities/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
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

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      const attributesTotal = (item.attributes || []).reduce((sum, attr) => sum + (attr.price || 0), 0);
      return total + itemTotal + (attributesTotal * item.quantity);
    }, 0);
  };

  const calculateTax = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      const attributesTotal = (item.attributes || []).reduce((sum, attr) => sum + (attr.price || 0), 0);
      const totalBeforeTax = itemTotal + (attributesTotal * item.quantity);
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

    // Check if customer details are missing and show modal if needed
    if (!responseData.uid && !responseData.bookingId && !responseData.tableId) {
      setShowCustomerModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const currentDate = new Date().toISOString();
      const subtotal = calculateSubtotal();
      const taxTotal = calculateTax();
      const total = subtotal + taxTotal;

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
        ordernote: "",
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
        buyerid: responseData.uid ? parseInt(responseData.uid) :117,
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
          itemqty: item.quantity,
          itemrate: parseFloat(item.price),
          itemamount: parseFloat(item.price) * item.quantity,
          itemtaxrate: item.taxPercentage.toString(),
          itemtaxamount: (parseFloat(item.price) * item.quantity * (item.taxPercentage / 100)),
          itemgrossamt: (parseFloat(item.price) * item.quantity) * (1 + (item.taxPercentage / 100)),
          itemnote: "",
          reqdeliverydate: currentDate,
          expdeliverydate: currentDate,
          itemuom: 0,
          itemuomcfactor: 0,
          itemselecteduom: 0,
          deliveredqty: 0,
          recivedqty: 0,
          ledgerid: 0,
          orderitemDetailsModel: item.attributes.map(attr => ({
            oidid: 0,
            attributeid: parseInt(attr.attributeId),
            avid: attr.id
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

      const response = await CallFor('orders', 'POST', orderData, "Auth");

      if (!response.data.success) {
        throw new Error('Failed to submit order');
      }

      clearCart();
      // Clear stored response data after successful order
      await AsyncStorage.removeItem('responseData');
      router.replace('/ordermenu');
      Alert.alert('Success', 'Your order has been placed successfully!', [
        { text: 'OK', onPress: () => router.replace('/ordermenu') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit order. Please try again.');
      console.error('Order submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSearch = async (searchTerm) => {
    if (searchTerm.length >= 4) {
      try {
        const response = await CallFor(
          `users/search-customer/${searchTerm}`,
          "GET",
          null,
          "Auth"
        );
        if (response.data.success) {
          setSearchResults(response.data.data);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace('/ordermenu')}>
          <IconSymbol name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Cart</Text>
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
                        : `http://172.16.1.57:5004${item.image}` 
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
                            updateQuantity(item.id, item.quantity - 1);
                          }
                        }}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.itemQuantity}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                  </View>
                  {item.variant && (
                    <Text style={styles.variantName}>{item.variant}</Text>
                  )}
                  {item.attributes?.map((attr, index) => (
                    <View key={index} style={styles.attributeRow}>
                      <Text style={styles.attributeName}>{attr.name}</Text>
                      <Text style={styles.attributePrice}>
                        {attr.price > 0 ? `₹${attr.price}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

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
            {isSubmitting ? 'Submitting...' : 'Submit Order'}
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
                  onChangeText={(text) => {
                    setMobileNumber(text);  
                    handleCustomerSearch(text);
                  }}
                  keyboardType="phone-pad"
                />
              </View>
              {mobileNumberError ? <Text style={styles.errorText}>{mobileNumberError}</Text> : null}
            </View>

            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <ScrollView style={styles.searchResultsScroll}>
                  {searchResults.map((customer) => (
                    <TouchableOpacity
                      key={customer.uid}
                      style={styles.searchResultItem}
                      onPress={() => {
                        setSelectedCustomer(customer);
                        setCustomerName(customer.fullname);
                        setMobileNumber(customer.mobno);
                        setSearchResults([]);
                      }}
                    >
                      <Text>{customer.fullname} - {customer.mobno}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
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
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
    color: '#333',
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
  searchResults: {
    maxHeight: 150,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  searchResultsScroll: {
    flex: 1,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
}); 