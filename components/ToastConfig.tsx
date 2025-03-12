import { View, StyleSheet } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';
import { ThemedText } from './ThemedText';

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <View style={[styles.toast, styles.successToast]}>
      <ThemedText style={styles.title}>{props.text1}</ThemedText>
      <ThemedText style={styles.message}>{props.text2}</ThemedText>
    </View>
  ),
  error: (props: BaseToastProps) => (
    <View style={[styles.toast, styles.errorToast]}>
      <ThemedText style={styles.title}>{props.text1}</ThemedText>
      <ThemedText style={styles.message}>{props.text2}</ThemedText>
    </View>
  ),
  info: (props: BaseToastProps) => (
    <View style={[styles.toast, styles.infoToast]}>
      <ThemedText style={styles.title}>{props.text1}</ThemedText>
      <ThemedText style={styles.message}>{props.text2}</ThemedText>
    </View>
  ),
};

const styles = StyleSheet.create({
  toast: {
    width: '90%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    marginHorizontal: '5%',
    marginTop: 10,
    minHeight: 60,
  },
  successToast: {
    backgroundColor: '#4CAF50',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  infoToast: {
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: 'white',
  },
}); 