import { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Yup from 'yup';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Toast from 'react-native-toast-message';
import CallFor from '@/utilities/CallFor';

export default function QueueScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  const [queue, setQueue] = useState([]);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [errors, setErrors] = useState({});
  const [editingGuest, setEditingGuest] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editGuestCount, setEditGuestCount] = useState('');
  const [editErrors, setEditErrors] = useState({});

  // Validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, 'Name must be at least 2 characters.')
      .required('Name is required.'),
    phoneNumber: Yup.string()
      .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
      .required('Phone number is required.'),
    guestCount: Yup.number()
      .required('Guest count is required.')
      .positive('Guest count must be positive')
  });

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await CallFor('queue', 'get', null, 'Auth');
      if (response?.data?.success) {
        setQueue(response.data.data.filter((v: any) => v.status != 1));
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error fetching queue'
      });
    }
  };

  const validateForm = async (values) => {
    try {
      await validationSchema.validate(values, { abortEarly: false });
      return true;
    } catch (validationErrors) {
      const newErrors = {};
      validationErrors.inner.forEach((error) => {
        newErrors[error.path] = error.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleAddToQueue = async () => {
    const isValid = await validateForm({ name, phoneNumber, guestCount });
    if (!isValid) return;

    try {
      const newGuest = {
        guest_name: name,
        guest_number: phoneNumber,
        guest_count: parseInt(guestCount),
      };

      const response = await CallFor('queue', 'post', newGuest, 'Auth');
      
      if (response?.data?.success) {
        fetchQueue();
        setName('');
        setPhoneNumber('');
        setGuestCount('');
        Toast.show({
          type: 'success',
          text1: 'Successfully added to queue'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to add to queue'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error adding to queue'
      });
    }
  };

  const handleAssignTable = async (guest: any) => {
    try {
      if (guest && guest.qid) {
        // Store guest data in AsyncStorage
        await AsyncStorage.setItem('queueData', JSON.stringify(guest));
      }
      router.push('/tables');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error storing queue data'
      });
    }
  };

  const handleEdit = async (guest: any) => {
    setEditingGuest(guest.qid);
    setEditName(guest.guest_name);
    setEditPhoneNumber(guest.guest_number);
    setEditGuestCount(guest.guest_count.toString());
  };

  const handleSaveEdit = async (qid : any) => {
    const isValid = await validateForm({
      name: editName,
      phoneNumber: editPhoneNumber,
      guestCount: editGuestCount
    });
    if (!isValid) return;

    try {
      const updatedGuest = {
        guest_name: editName,
        guest_number: editPhoneNumber,
        guest_count: parseInt(editGuestCount),
      };

      const response = await CallFor(`queue/${qid}`, 'put', updatedGuest, 'Auth');
      
      if (response?.data?.success) {
        setEditingGuest(null);
        fetchQueue();
        Toast.show({
          type: 'success',
          text1: 'Successfully updated guest'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to update guest'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error updating guest'
      });
    }
  };

  const handleDelete = async (qid) => {
    try {
      const response = await CallFor(`queue/${qid}`, 'delete', null, 'Auth');
      
      if (response?.data?.success) {
        fetchQueue();
        Toast.show({
          type: 'success',
          text1: 'Successfully removed from queue'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to remove from queue'
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error removing from queue'
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <ScrollView>
        {/* Add Guest Form */}
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Add to Queue</Text>
          
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Guest Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors[colorScheme].text}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="number-pad"
            maxLength={10}
            placeholderTextColor={Colors[colorScheme].text}
          />
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

          <TextInput
            style={[styles.input, errors.guestCount && styles.inputError]}
            placeholder="Number of Guests"
            value={guestCount}
            onChangeText={setGuestCount}
            keyboardType="number-pad"
            placeholderTextColor={Colors[colorScheme].text}
          />
          {errors.guestCount && <Text style={styles.errorText}>{errors.guestCount}</Text>}

          <TouchableOpacity style={styles.addButton} onPress={handleAddToQueue}>
            <Text style={styles.buttonText}>Add to Queue</Text>
          </TouchableOpacity>
        </View>

        {/* Queue List */}
        <View style={styles.queueList}>
          <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Current Queue</Text>
          
          {queue.map((guest) => (
            <View key={guest.qid} style={styles.queueItem}>
              <View style={styles.guestInfo}>
                {editingGuest === guest.qid ? (
                  <View>
                    <TextInput
                      style={[styles.input, editErrors.name && styles.inputError]}
                      value={editName}
                      onChangeText={setEditName}
                      placeholderTextColor={Colors[colorScheme].text}
                    />
                    <TextInput
                      style={[styles.input, editErrors.phoneNumber && styles.inputError]}
                      value={editPhoneNumber}
                      onChangeText={setEditPhoneNumber}
                      keyboardType="number-pad"
                      maxLength={10}
                      placeholderTextColor={Colors[colorScheme].text}
                    />
                    <TextInput
                      style={[styles.input, editErrors.guestCount && styles.inputError]}
                      value={editGuestCount}
                      onChangeText={setEditGuestCount}
                      keyboardType="number-pad"
                      placeholderTextColor={Colors[colorScheme].text}
                    />
                  </View>
                ) : (
                  <>
                    <Text style={[styles.guestName, { color: Colors[colorScheme].text }]}>
                      {guest.guest_name}
                    </Text>
                    <Text style={[styles.guestDetails, { color: Colors[colorScheme].text }]}>
                      {guest.guest_count} guests • {guest.guest_number}
                      {guest.status === 1 && ' • Assigned'}
                    </Text>
                  </>
                )}
              </View>
              
              <View style={styles.actionButtons}>
                {editingGuest === guest.qid ? (
                  <TouchableOpacity 
                    style={[styles.saveButton, guest.status != 0 && styles.disabledButton]}
                    onPress={() => handleSaveEdit(guest.qid)}
                    disabled={guest.status != 0}
                  >
                    <IconSymbol name="save" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={[styles.editButton, guest.status != 0 && styles.disabledButton]}
                      onPress={() => handleEdit(guest)}
                      disabled={guest.status != 0}
                    >
                      <IconSymbol name="pencil" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.assignButton, guest.status != 0 && styles.disabledButton]}
                      onPress={() => handleAssignTable(guest)}
                      disabled={guest.status != 0}
                    >
                      <IconSymbol name="tablerestaurant" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteButton, guest.status != 0 && styles.disabledButton]}
                      onPress={() => handleDelete(guest.qid)}
                      disabled={guest.status != 0}
                    >
                      <IconSymbol name="trash" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  queueList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  guestDetails: {
    fontSize: 14,
    color: '#666666',
  },
  assignButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
    marginLeft: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  editButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.9,
  },
}); 