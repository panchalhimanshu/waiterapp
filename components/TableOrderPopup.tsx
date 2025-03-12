import { Modal, StyleSheet, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useRouter } from 'expo-router';
import { useAuth } from '@/utilities/AuthContext';
import CallFor from '@/utilities/CallFor';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TableOrderPopupProps {
  tableName: string;
  orderId: string | null;
  tableId: number;
  tableOrderId: number;
  mergeOptions: any[];
  waiters: Array<{ uid: string; fullname: string }>;
  onClose: () => void;
  loading: boolean;
  capacity: number;
}

const TableOrderPopup = ({
  tableName,
  orderId,
  tableId,
  tableOrderId,
  mergeOptions,
  waiters,
  onClose,
  loading,
  capacity
}: TableOrderPopupProps) => {
  const [selectedWaiter, setSelectedWaiter] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mergeTableId, setMergeTableId] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const router = useRouter();
  const { authData } = useAuth();

  useEffect(() => {
    fetchOrderDetails();
    
  }, []);
  console.log(mergeOptions, "mergeOptions");
  const fetchOrderDetails = async () => {
    try {
      const response = await CallFor(`bookings/${tableOrderId}`, 'GET', null, 'Auth');
      if (response.data?.success) {
        const orderData = response.data.data;
        setBookingData(orderData);
        setCustomerName(orderData.fullname);
        setMobileNumber(orderData.mobno);
        setSelectedWaiter(orderData.waiter_id);
        setGuestCount(orderData.no_of_guests);
        setMergeTableId(orderData.merge_table_id?.[0]);
        setUserId(orderData.uid);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleBook = async () => {
    setIsSubmitted(true);

    if (!guestCount) {
      setErrorMessage("Number of guests is required.");
      return;
    }

    if (!selectedWaiter) {
      setErrorMessage("Please select a waiter.");
      return;
    }

    if (!mobileNumber || mobileNumber.length != 10) {
      setErrorMessage("A valid 10-digit mobile number is required.");
      return;
    }

    setErrorMessage("");

    const body = {
      ...bookingData,
      no_of_guests: guestCount,
      waiter_id: selectedWaiter,
      merge_table_id: guestCount > capacity ? (mergeTableId ? [mergeTableId] : null) : null,
    };

    try {
      const userUpdateResponse = await CallFor(
        `users/updateusers/${userId}`,
        'PUT',
        {
          fullname: customerName,
          mobno: mobileNumber,
        },
        'Auth'
      );

      if (userUpdateResponse.data.data?.error?.details?.constraint == "mobno_unique") {
        setErrorMessage("This mobile number is already registered with another customer.");
        return;
      }

      await CallFor(`bookings/${tableOrderId}`, 'PUT', body, 'Auth');
      setUpdateMsg("Updated Successfully...");

      setTimeout(() => {
        setUpdateMsg(null);
      }, 2000);
    } catch (error) {
      setErrorMessage("An error occurred while updating. Please try again.");
    }
  };

  const handleCreateOrder = async () => {
    try {
      const responseData = {
        bookingId: tableOrderId.toString(),
        tableId: tableId.toString(),
        uid: userId?.toString() || ''
      };
      
      await AsyncStorage.setItem('responseData', JSON.stringify(responseData));
      router.push('/ordermenu');
    } catch (error) {
      console.error('Error storing order data:', error);
      setErrorMessage('Failed to create order. Please try again.');
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Table Order</ThemedText>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <IconSymbol name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* <ThemedText style={styles.tableName}>{tableName}</ThemedText> */}
          <ThemedText style={styles.orderNumber}>Order #{tableName}</ThemedText>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Mobile Number</ThemedText>
            <TextInput
              style={styles.input}
              value={mobileNumber}
              onChangeText={text => setMobileNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="Enter 10-digit mobile number"
            />
            {isSubmitted && (!mobileNumber || mobileNumber.length != 10) && (
              <ThemedText style={styles.errorText}>
                A valid 10-digit mobile number is required.
              </ThemedText>
            )}
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Customer Name</ThemedText>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Number of Guests (Max: {capacity})</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.guestCountContainer}>
                {[1,2,3,4,5,6,7,8,9,10,'More than 10'].map((count) => (
                  <TouchableOpacity
                    key={count}
                    onPress={() => setGuestCount(count == 'More than 10' ? 11 : count)}
                    style={[
                      styles.guestCountButton,
                      guestCount == (count == 'More than 10' ? 11 : count) && styles.selectedGuestCount
                    ]}
                  >
                    <ThemedText style={[
                      styles.guestCountText,
                      guestCount == (count == 'More than 10' ? 11 : count) && styles.selectedGuestCountText
                    ]}>
                      {count}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {guestCount > capacity && (
            <View style={styles.mergeTablesContainer}>
              <ThemedText style={styles.label}>Merge Table?</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.mergeTablesGrid}>
                  {mergeOptions.map((table) => (
                    <TouchableOpacity
                      key={table.table_id}
                      onPress={() => setMergeTableId(mergeTableId == table.table_id ? null : table.table_id)}
                      disabled={table.status != '35' && table.table_id != bookingData?.merge_table_id?.[0]}
                      style={[
                        styles.mergeTableButton,
                        mergeTableId == table.table_id && styles.selectedMergeTable,
                        table.status != '35' && table.table_id != bookingData?.merge_table_id?.[0] && styles.disabledMergeTable
                      ]}
                    >
                      <ThemedText style={styles.mergeTableText}>
                        {table.table_name} ({table.capacity})
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {updateMsg && (
            <ThemedText style={styles.successText}>{updateMsg}</ThemedText>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleBook}
            >
              <ThemedText style={styles.buttonText}>Update</ThemedText>
            </TouchableOpacity>
            {orderId == null ? (
              <TouchableOpacity
                style={styles.createOrderButton}
                onPress={handleCreateOrder}
              >
                <ThemedText style={styles.buttonText}>Create Order</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.editOrderButton}
                // onPress={() => router.push(`/ordermenu/edit/${orderId}`)}
              >
                <ThemedText style={styles.buttonText}>Edit Order</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {orderId != null && (
            <TouchableOpacity
              style={styles.seeDetailsButton}
              onPress={() => {
                router.push({
                  pathname: "/(details)/[id]",
                  params: { id: `${orderId}` }
                });
                onClose();
              }}
            >
              <ThemedText style={styles.seeDetailsText}>See Details</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  tableName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom:0,
  },
  orderNumber: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  guestCountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  guestCountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedGuestCount: {
    borderColor: '#000',
    backgroundColor: '#f0f0f0',
  },
  guestCountText: {
    fontSize: 14,
  },
  selectedGuestCountText: {
    color: '#000',
  },
  mergeTablesContainer: {
    marginTop: 16,
  },
  mergeTablesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mergeTableButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedMergeTable: {
    borderColor: '#000',
    backgroundColor: '#fff3cd',
  },
  disabledMergeTable: {
    backgroundColor: '#ffcdd2',
    opacity: 0.5,
  },
  mergeTableText: {
    fontSize: 14,
  },
  successText: {
    color: 'green',
    textAlign: 'center',
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop:10,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  createOrderButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  editOrderButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  seeDetailsButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  seeDetailsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});

export default TableOrderPopup; 