import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useState, useLayoutEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Callfor from "@/utilities/CallFor";
import { useAuth } from '@/utilities/AuthContext';

const LoginScreen = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const { setAuthData } = useAuth();

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://172.16.1.57:5001/api/v2/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: id,
          password,
        }),
      });
      
      const data = await response.json();

      if (response.ok) {
        // AuthContext में डेटा सेट करें
        setAuthData({
          token: data.data.token,
          userData: data.data
        });
        
        router.replace('/tables');
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require("C:/reactnative/myApp/assets/images/waiter.png")} 
        style={[styles.logo, { tintColor: 'green' }]} 
      />
      <Text style={styles.welcomeText}>Welcome to the</Text>
      <Text style={styles.appName}>WAITER APP</Text>
      
      <View style={styles.inputContainer}>
        <IconSymbol name="envelope" size={20} color="#666" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholder="Id" 
          placeholderTextColor="#aaa"
          value={id}
          onChangeText={setId}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <IconSymbol name="lock" size={20} color="#666" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          placeholderTextColor="#aaa" 
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      
      <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
        <Text style={styles.loginText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: "#444",
  },
  appName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  icon: {
    marginRight: 10,
    color: "green",
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: "#222",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoginScreen;
