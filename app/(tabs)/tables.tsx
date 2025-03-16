import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Dimensions, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CommonHeader } from '@/components/CommonHeader';
import CallFor from "@/utilities/CallFor";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/utilities/AuthContext';
import TableOrderPopup from '@/components/TableOrderPopup';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureResponderEvent } from 'react';
import { ScrollRefresh } from '@/components/ScrollRefresh';

interface Table {
  table_id: number;
  table_name: string;
  capacity: number;
  status: string;
  booking_id: number | null;
  booking_uid: string | null;
  order_id: number | null;
}

interface Floor {
  floor_id: number;
  floor_name: string;
  floor_number: number;
  tables: Table[];
}

export default function TablesScreen() {
  const router = useRouter();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [selectedWaiter, setSelectedWaiter] = useState('');
  const [mergeTableIds, setMergeTableIds] = useState<string[]>([]);
  const [waiters, setWaiters] = useState<Array<{uid: string, fullname: string}>>([]);
  const [bookingTime, setBookingTime] = useState('');
  const { authData } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isInputChanged, setIsInputChanged] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [queueData, setQueueData] = useState(null);
  const [queueId, setQueueId] = useState('');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await CallFor('tables/floors/50', 'GET', null, 'Auth');
      if (response.data?.success) {
        setFloors(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModalData = async () => {
    try {
      const response = await CallFor('bookings/modal', 'GET', null, 'Auth');
      if (response.data?.success) {
        setWaiters(response.data.data.waiters);
        setBookingTime(response.data.data.currentDateTime);
      }
    } catch (error) {
      console.error('Error fetching modal data:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTables();
    }, [])
  );

  useEffect(() => {
    // Check for queue data when component mounts
    const checkQueueData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('queueData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setQueueData(parsedData);
          // Pre-fill the form with queue data
          setMobileNumber(parsedData.guest_number || '');
          setCustomerName(parsedData.guest_name || '');
          setGuestCount(parsedData.guest_count || 1);
          setQueueId(parsedData.qid);
          // Clear the stored data immediately
          await AsyncStorage.removeItem('queueData');
        } else {
          // Clear all form fields if no queue data exists
          setQueueData(null);
          setMobileNumber('');
          setCustomerName('');
          setGuestCount(1);
          setQueueId('');
          setSelectedCustomer(null);
          setMergeTableIds([]);
          setIsInputChanged(false);
          setApiError('');
        }
      } catch (error) {
        console.error('Error reading queue data:', error);
      }
    };

    checkQueueData();
  }, [showBookingModal]); // Add showBookingModal as a dependency

  // Separate useEffect for searching customers
  useEffect(() => {
    // Search customers if initial mobile number exists and is >= 4 digits
    if (mobileNumber && mobileNumber.length >= 4) {
      searchCustomers(mobileNumber);
    }
  }, [mobileNumber]); // Run when mobileNumber changes

  useEffect(() => {
    const updateLayout = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    Dimensions.addEventListener('change', updateLayout);
    return () => {
      // Clean up event listener
      // Note: For newer React Native versions, the cleanup might not be necessary
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener('change', updateLayout);
      }
    };
  }, []);

  const showTableAssignmentPopup = (guest: any) => {
    // When a guest is assigned from queue, pre-fill the booking modal
    if (guest) {
      setSelectedTable(null); // Reset any selected table
      setMobileNumber(guest.guest_number || '');
      setCustomerName(guest.guest_name || '');
      setGuestCount(guest.guest_count || 1);
      setShowBookingModal(true);
      setQueueId(guest.qid);
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case '35': return {
        colors: ['#D1D5DB', '#9CA3AF'], // gray-300 to gray-400
        borderColor: '#6B7280' // gray-500
      };
      case '38': return {
        colors: ['#BFDBFE', '#93C5FD'], // blue-200 to blue-300
        borderColor: '#3B82F6' // blue-500
      };
      case '37': return {
        colors: ['#BBF7D0', '#BBF7D0'], // green-200 to green-200
        borderColor: '#22C55E' // green-500
      };
      case '39': return {
        colors: ['#FEF3C7', '#FDE68A'], // yellow-100 to yellow-200
        borderColor: '#FBBF24' // yellow-400
      };
      default: return {
        colors: ['#F3F4F6', '#E5E7EB'],
        borderColor: '#D1D5DB'
      };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case '35': return 'Available';
      case '38': return 'Waiting';
      case '37': return 'Occupied';
      case '39': return 'Bill Settlement';
      default: return 'Unknown';
    }
  };

  const handleTablePress = (table) => {
    setSelectedTable(table);
    
    // If table status is 35 (Available), show booking modal
    if (table.status == '35') {
      setShowBookingModal(true);
    } 
    // For all other statuses, show order popup
    else {
      setShowOrderPopup(true);
    }
  };

  const handleBooking = async () => {
    setIsSubmitted(true);

    if (!guestCount) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Number of guests is required',
      });
      return;
    }

    if (!mobileNumber || mobileNumber.length !== 10) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'A valid 10-digit mobile number is required',
      });
      return;
    }

    let customeruid;

    // If a customer was selected and input wasn't changed, use their UID
    if (selectedCustomer && !isInputChanged) {
      customeruid = selectedCustomer.uid;
    } else {
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

        if (!customerResponse.data.success) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: customerResponse.data.message || 'Failed to register customer',
          });
          return;
        }

        customeruid = customerResponse.data.data.uid;
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.message || 'An error occurred while registering the customer',
        });
        return;
      }
    }

    try {
      // Convert mergeTableIds from strings to integers
      const mergeTableIdsAsIntegers = guestCount > selectedTable?.capacity ? mergeTableIds.map(id => parseInt(id, 10)) : null;

      const response = await CallFor(
        "bookings",
        "POST",
        JSON.stringify({
          booking_id: 0,
          booking_name: null,
          booking_contact: null,
          booking_time: new Date().toISOString(),
          table_id: selectedTable?.table_id,
          no_of_guests: guestCount,
          waiter_id: authData.userData.uid,
          merge_table_id: mergeTableIdsAsIntegers, // Send as array of integers
          uid: customeruid,
          qid: queueId
        }),
        "Auth"
      );

      if (response.data?.success) {
        setIsBookingModalVisible(false);
        
        // Store all values as a single object
        const responseData = {
          bookingId: response.data.data.booking_id.toString(),
          tableId: selectedTable?.table_id.toString() || '',
          uid: response.data.data.uid.toString()
        };
        
        await AsyncStorage.setItem('responseData', JSON.stringify(responseData));
        
        router.push('/ordermenu');
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Table booked successfully',
      });
      
      setShowBookingModal(false);
      // Reset form
      setMobileNumber('');
      setCustomerName('');
      setGuestCount(null);
      setSelectedWaiter(null);
      setMergeTableIds([]);
      setIsSubmitted(false);
      
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to book table. Please try again.',
      });
    }
  };

  const searchCustomers = async (searchNumber: string) => {
    if (searchNumber.length >= 4) {
      try {
        const response = await CallFor(
          `users/search-customer/${searchNumber}`,
          'GET',
          null,
          'Auth'
        );
        if (response.data?.success) {
          setCustomerList(response.data.data);
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      }
    } else {
      setCustomerList([]);
    }
  };

  const handleMobileChange = (text: string) => {
    const value = text.replace(/[^0-9]/g, '');
    setMobileNumber(value);
    setIsInputChanged(true);
    setApiError("");
    setSelectedCustomer(null);
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.fullname);
    setMobileNumber(customer.mobno);
    setCustomerList([]);
    setIsInputChanged(false);
    setApiError("");
  };

  const TableWithChairs = ({ table, onPress, status }) => {
    // Updated chair layout calculation to show exact capacity
    const getChairLayout = () => {
      const totalChairs = table.capacity;
      
      // Distribute chairs evenly, prioritizing sides for larger tables
      if (totalChairs <= 4) {
        // For 1-4 chairs, put one on each side starting from top
        return {
          top: totalChairs >= 1 ? 1 : 0,
          right: totalChairs >= 2 ? 1 : 0,
          bottom: totalChairs >= 3 ? 1 : 0,
          left: totalChairs >= 4 ? 1 : 0
        };
      } else {
        // For more than 4 chairs, distribute evenly
        const remainingChairs = totalChairs - 4;
        const extraPerSide = Math.floor(remainingChairs / 4);
        const leftover = remainingChairs % 4;
        
        return {
          top: 1 + extraPerSide + (leftover > 0 ? 1 : 0),
          right: 1 + extraPerSide + (leftover > 1 ? 1 : 0),
          bottom: 1 + extraPerSide + (leftover > 2 ? 1 : 0),
          left: 1 + extraPerSide + (leftover > 3 ? 1 : 0)
        };
      }
    };

    const layout = getChairLayout();
    const tableWidth = table.capacity > 8 ? 160 : table.capacity > 4 ? 120 : 80;
    const tableHeight = table.capacity > 8 ? 100 : table.capacity > 4 ? 80 : 80;

    const statusColors = getStatusColors(status);

    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.tableWrapper,
          { 
            width: tableWidth + 80,
            height: tableHeight + 40,
          }
        ]}
      >
        {/* Top Chairs */}
        <View style={styles.chairRow}>
          {Array(layout.top).fill(0).map((_, i) => (
            <View 
              key={`top-${i}`} 
              style={[
                styles.chair, 
                styles.chairTop,
                {
                  width: 20,
                  height: 12,
                  backgroundColor: statusColors.colors[0],
                  borderColor: statusColors.borderColor,
                  borderWidth: 0.5,
                }
              ]} 
            />
          ))}
        </View>

        <View style={styles.middleSection}>
          {/* Left Chairs */}
          <View style={styles.chairColumn}>
            {Array(layout.left).fill(0).map((_, i) => (
              <View 
                key={`left-${i}`} 
                style={[
                  styles.chair, 
                  styles.chairLeft,
                  {
                    width: 12,
                    height: 20,
                    backgroundColor: statusColors.colors[0],
                    borderColor: statusColors.borderColor,
                    borderWidth: 0.5,
                  }
                ]} 
              />
            ))}
          </View>

          {/* Table with gradient */}
          <LinearGradient
            colors={statusColors.colors}
            style={[
              styles.table,
              {
                width: tableWidth,
                height: tableHeight,
                borderColor: statusColors.borderColor,
                borderWidth: 1,
                borderRadius: table.capacity > 4 ? 8 : 12,
              }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ThemedText style={styles.tableName}>{table.table_name}</ThemedText>
          </LinearGradient>

          {/* Right Chairs */}
          <View style={styles.chairColumn}>
            {Array(layout.right).fill(0).map((_, i) => (
              <View 
                key={`right-${i}`} 
                style={[
                  styles.chair, 
                  styles.chairRight,
                  {
                    width: 12,
                    height: 20,
                    backgroundColor: statusColors.colors[0],
                    borderColor: statusColors.borderColor,
                    borderWidth: 0.5,
                  }
                ]} 
              />
            ))}
          </View>
        </View>

        {/* Bottom Chairs */}
        <View style={styles.chairRow}>
          {Array(layout.bottom).fill(0).map((_, i) => (
            <View 
              key={`bottom-${i}`} 
              style={[
                styles.chair, 
                styles.chairBottom,
                {
                  width: 20,
                  height: 12,
                  backgroundColor: statusColors.colors[0],
                  borderColor: statusColors.borderColor,
                  borderWidth: 0.5,
                }
              ]} 
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTables();
    setRefreshing(false);
  };

  const getStatusCode = (status: string): string => {
    switch (status) {
      case 'Available': return '35';
      case 'Waiting': return '38';
      case 'Occupied': return '37';
      case 'Bill Settlement': return '39';
      default: return '';
    }
  };

  const handleFilterPress = (status: string) => {
    // If already selected, clear the filter, otherwise set new filter
    setSelectedFilter(selectedFilter == status ? null : status);
  };

  const getFilteredTables = (tables: Table[]) => {
    if (!selectedFilter) return tables;
    const statusCode = getStatusCode(selectedFilter);
    return tables.filter(table => table.status == statusCode);
  };

  return (
    <ThemedView style={styles.container}>
      <CommonHeader title="Table Booking" />
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.legendScroll}
      >
        <View style={styles.legend}>
          <TouchableOpacity 
            style={[
              styles.legendItem,
              selectedFilter == 'Available' && styles.selectedLegendItem
            ]}
            onPress={() => handleFilterPress('Available')}
          >
            <View style={[styles.legendDot, { backgroundColor: '#808080' }]} />
            <ThemedText style={selectedFilter == 'Available' && styles.selectedLegendText}>
              Available
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.legendItem,
              selectedFilter == 'Waiting' && styles.selectedLegendItem
            ]}
            onPress={() => handleFilterPress('Waiting')}
          >
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <ThemedText style={selectedFilter == 'Waiting' && styles.selectedLegendText}>
              Waiting
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.legendItem,
              selectedFilter == 'Occupied' && styles.selectedLegendItem
            ]}
            onPress={() => handleFilterPress('Occupied')}
          >
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <ThemedText style={selectedFilter == 'Occupied' && styles.selectedLegendText}>
              Occupied
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.legendItem,
              selectedFilter == 'Bill Settlement' && styles.selectedLegendItem
            ]}
            onPress={() => handleFilterPress('Bill Settlement')}
          >
            <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
            <ThemedText style={selectedFilter == 'Bill Settlement' && styles.selectedLegendText}>
              Bill Settlement
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.floorSelectorScroll}
      >
        <View style={styles.floorSelector}>
          {floors.map((floor) => (
            <TouchableOpacity
              key={floor.floor_id}
              style={[
                styles.floorButton,
                selectedFloor == floor.floor_id && styles.selectedFloorButton
              ]}
              onPress={() => setSelectedFloor(floor.floor_id)}
            >
              <ThemedText style={[
                styles.floorButtonText,
                selectedFloor == floor.floor_id && styles.selectedFloorText
              ]}>
                {floor.floor_name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollRefresh 
        style={styles.tablesContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <View style={styles.tablesGrid}>
          {getFilteredTables(
            floors.find(floor => floor.floor_id == selectedFloor)?.tables || []
          ).map((table) => (
            <View 
              key={table.table_id} 
              style={[
                styles.tableWrapper,
                { 
                  width: screenWidth >= 768 // tablet breakpoint
                    ? table.capacity > 8 
                      ? '32%'  // Large tables show 3 per row on tablet
                      : '24%'  // Normal tables show 4 per row on tablet
                    : table.capacity > 8
                      ? '100%' // Large tables show 1 per row on mobile
                      : '48%'  // Normal tables show 2 per row on mobile
                }
              ]}
            >
              <TableWithChairs
                table={table}
                onPress={() => handleTablePress(table)}
                status={table.status}
              />
            </View>
          ))}
        </View>
      </ScrollRefresh>

      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Table Order</Text>
            <Text>Order #T-{selectedTable?.table_id}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                placeholder="Enter 10-digit mobile number"
                value={mobileNumber}
                onChangeText={handleMobileChange}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />
              
              {customerList.length > 0 && !selectedCustomer && (
                <ScrollView style={styles.customerList}>
                  {customerList.map((customer) => (
                    <TouchableOpacity
                      key={customer.uid}
                      style={styles.customerItem}
                      onPress={() => handleCustomerSelect(customer)}
                    >
                      <ThemedText style={styles.customerName}>
                        {customer.fullname}
                      </ThemedText>
                      <ThemedText style={styles.customerPhone}>
                        {customer.mobno}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Customer Name</Text>
              <TextInput
                placeholder="Customer Name"
                value={customerName}
                onChangeText={setCustomerName}
                style={styles.input}
                editable={!selectedCustomer || isInputChanged}
              />
            </View>

            <Text>Number of Guests (Max: {selectedTable?.capacity})</Text>
            <View style={styles.guestCountContainer}>
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.guestCountButton,
                    guestCount == num && styles.selectedGuestCount
                  ]}
                  onPress={() => setGuestCount(num)}
                >
                  <Text style={[
                    styles.guestCountText,
                    guestCount == num && styles.selectedGuestCountText
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {guestCount > (selectedTable?.capacity || 0) && (
              <View style={styles.mergeTables}>
                <Text>Merge Tables</Text>
                <View style={styles.mergeTableGrid}>
                  {floors
                    .find(floor => floor.floor_id == selectedFloor)
                    ?.tables
                    .filter(table => 
                      table.status == '35' && // Only available tables
                      table.table_id != selectedTable?.table_id // Exclude current table
                    )
                    .map(table => (
                      <TouchableOpacity
                        key={table.table_id}
                        style={[
                          styles.mergeTableButton,
                          mergeTableIds.includes(table.table_id.toString()) && styles.selectedMergeTable
                        ]}
                        onPress={() => {
                          const tableId = table.table_id.toString();
                          setMergeTableIds(prev => 
                            prev.includes(tableId)
                              ? prev.filter(id => id != tableId)
                              : [...prev, tableId]
                          );
                        }}
                      >
                        <Text style={[
                          styles.mergeTableText,
                          mergeTableIds.includes(table.table_id.toString()) && styles.selectedMergeTableText
                        ]}>
                          {table.table_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}

            {/* <Text style={styles.sectionTitle}>Select Waiter</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.waiterContainer}
            >
              {waiters.map((waiter) => (
                <TouchableOpacity
                  key={waiter.uid}
                  style={[
                    styles.waiterButton,
                    selectedWaiter == waiter.uid && styles.selectedWaiter
                  ]}
                  onPress={() => setSelectedWaiter(waiter.uid)}
                >
                  <Text style={[
                    styles.waiterText,
                    selectedWaiter == waiter.uid && styles.selectedWaiterText
                  ]}>
                    {waiter.fullname}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView> */}

            {/* <Text style={styles.bookingTime}>Booking Time: {bookingTime}</Text> */}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBookingModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleBooking}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {showOrderPopup && selectedTable && (
        <TableOrderPopup
          tableName={selectedTable.table_name}
          orderId={selectedTable.order_id}
          tableId={selectedTable.table_id}
          tableOrderId={selectedTable.booking_id}
          mergeOptions={floors
            .find(floor => floor.floor_id == selectedFloor)
            ?.tables.filter(t => t.table_id != selectedTable.table_id) || []}
          waiters={waiters}
          onClose={() => setShowOrderPopup(false)}
          loading={loading}
          capacity={selectedTable.capacity}
        />
      )}
      {loading && <LoadingSpinner />}
      <Toast />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floorSelector: {
    flexDirection: 'row',
    padding: 16,
    paddingTop:4,
    gap: 8,
  },
  floorButton: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedFloorButton: {
    backgroundColor: 'green',
  },
  floorButtonText: {
    fontSize: 14,
  },
  selectedFloorText: {
    color: '#fff',
  },
  tablesContainer: {
    flex: 1,
    padding: 8,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
    gap: 8,
  },
  tableWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  table: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    margin: 2,
  },
  tableName: {
    borderWidth: 0.5,
    borderColor: 'transparent',
    padding:10,
    backgroundColor:'#f1f5f5',
    borderRadius:80,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableStatus: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  chair: {
    margin: 1,
  },
  chairRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  chairColumn: {
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 2,
  },
  middleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chairTop: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  chairBottom: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  chairLeft: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  chairRight: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  legendScroll: {
    flexGrow: 0,
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  floorSelectorScroll: {
    flexGrow: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
  },
  guestCountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  guestCountButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  selectedGuestCount: {
    backgroundColor: '#000',
    color: 'white',
  },
  mergeTables: {
    marginTop: 10,
  },
  mergeTableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  mergeTableButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  selectedMergeTable: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  continueButton: {
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
  },
  waiterContainer: {
    flexGrow: 0,
    marginBottom: 15,
  },
  waiterButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
  },
  selectedWaiter: {
    backgroundColor: '#000',
  },
  selectedWaiterText: {
    color: '#fff',
  },
  bookingTime: {
    fontSize: 14,
    color: '#666',
    marginVertical: 10,
  },
  guestCountText: {
    color: '#000',
  },
  selectedGuestCountText: {
    color: '#fff',
  },
  mergeTableText: {
    color: '#000',
  },
  selectedMergeTableText: {
    color: '#fff',
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
  capacityText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginTop: 2,
  },
  selectedLegendItem: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#000',
  },
  selectedLegendText: {
    fontWeight: 'bold',
  },
}); 