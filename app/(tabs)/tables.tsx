import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CommonHeader } from '@/components/CommonHeader';
import CallFor from "@/utilities/CallFor";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    fetchTables();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '35': return '#808080'; // Available - gray
      case '37': return '#2196F3'; // Waiting - blue
      case '38': return '#4CAF50'; // Occupied - green
      case '39': return '#FFC107'; // Bill Settlement - yellow
      default: return '#E0E0E0';
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case '35': return '#F5F5F5'; // Light gray
      case '37': return '#E3F2FD'; // Light blue
      case '38': return '#E8F5E9'; // Light green
      case '39': return '#FFF8E1'; // Light yellow
      default: return '#FAFAFA';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case '35': return 'Available';
      case '37': return 'Waiting';
      case '38': return 'Occupied';
      case '39': return 'Bill Settlement';
      default: return 'Unknown';
    }
  };

  const handleTablePress = async (table: Table) => {
    setSelectedTable(table);
    await fetchModalData();
    setIsBookingModalVisible(true);
  };

  const handleBooking = async () => {
    try {
      // Create customer first
      const customerResponse = await CallFor(
        "users/customer",
        "POST",
        JSON.stringify({
          fullname: customerName,
          mobno: mobileNumber,
        }),
        "Auth"
      );

      if (customerResponse.data?.success) {
        const customerUid = customerResponse.data.data.uid;

        // Create booking with merge table IDs as array
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
            waiter_id: selectedWaiter,
            merge_table_id: mergeTableIds.length > 0 ? mergeTableIds : [], // Send as array
            uid: customerUid,
            qid: null
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
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    }
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
          <TouchableOpacity style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#808080' }]} />
            <ThemedText>Available</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <ThemedText>Waiting</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <ThemedText>Occupied</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
            <ThemedText>Bill Settlement</ThemedText>
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

      <ScrollView style={styles.tablesContainer}>
        <View style={styles.tablesGrid}>
          {floors
            .find(floor => floor.floor_id == selectedFloor)
            ?.tables.map((table) => (
              <TouchableOpacity
                key={table.table_id}
                style={[styles.tableCard, { 
                  borderColor: getStatusColor(table.status),
                  backgroundColor: getStatusBackgroundColor(table.status)
                }]}
                onPress={() => handleTablePress(table)}
              >
                <ThemedText style={styles.tableName}>{table.table_name}</ThemedText>
                <ThemedText style={styles.tableCapacity}>
                  Seats: {table.capacity}
                </ThemedText>
                <ThemedText style={styles.tableStatus}>
                  {getStatusText(table.status)}
                </ThemedText>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>

      <Modal
        visible={isBookingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsBookingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Table Order</Text>
            <Text>Order #T-{selectedTable?.table_id}</Text>
            
            <TextInput
              placeholder="Enter 10-digit mobile number"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <TextInput
              placeholder="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              style={styles.input}
            />

            <Text>Number of Guests (Max: {selectedTable?.capacity})</Text>
            <View style={styles.guestCountContainer}>
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.guestCountButton,
                    guestCount === num && styles.selectedGuestCount
                  ]}
                  onPress={() => setGuestCount(num)}
                >
                  <Text style={[
                    styles.guestCountText,
                    guestCount === num && styles.selectedGuestCountText
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
                      table.status === '35' && // Only available tables
                      table.table_id !== selectedTable?.table_id // Exclude current table
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
                              ? prev.filter(id => id !== tableId)
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

            <Text style={styles.sectionTitle}>Select Waiter</Text>
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
            </ScrollView>

            {/* <Text style={styles.bookingTime}>Booking Time: {bookingTime}</Text> */}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsBookingModalVisible(false)}
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
    padding: 16,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tableCard: {
    width: '30%',
    aspectRatio: 1,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  tableName: {
    fontSize: 16,
    fontWeight: '600',
  },
  tableCapacity: {
    fontSize: 12,
    marginTop: 4,
  },
  tableStatus: {
    fontSize: 10,
    marginTop: 4,
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
  modalContainer: {
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
  waiterText: {
    color: '#000',
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
}); 