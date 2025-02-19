import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, TextInput, StyleSheet, Switch } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


const Tab = createBottomTabNavigator();


// Serial Terminal Tab with Lux, Temperature, and Humidity Data
const SerialTerminalTab = () => {
 const [lux, setLux] = useState<number | null>(null);
 const [temperature, setTemperature] = useState<number | null>(null);
 const [humidity, setHumidity] = useState<number | null>(null);
 const [terminalData, setTerminalData] = useState<string>('Fetching Sensor Data...');
 const [message, setMessage] = useState<string>(''); // Store message to send to Arduino
 const [errorMessage, setErrorMessage] = useState<string>('');


 // Function to fetch sensor data (lux, temperature, humidity)
 useEffect(() => {
   const fetchSensorData = async () => {
     try {
       const response = await fetch('http://192.168.2.38/sensorData'); // ESP32 IP address
       if (response.ok) {
         const data = await response.json();
         setLux(data.lux);
         setTemperature(data.temperature);
         setHumidity(data.humidity);
         setTerminalData(
           `Lux: ${data.lux} \nTemperature: ${data.temperature}°C \nHumidity: ${data.humidity}%`
         );
       } else {
         setErrorMessage('Failed to fetch sensor data');
       }
     } catch (error) {
       setErrorMessage('Error fetching sensor data');
     }
   };


   fetchSensorData(); // Initial fetch
   const intervalId = setInterval(fetchSensorData, 5000); // Fetch every 5 seconds
   return () => clearInterval(intervalId); // Cleanup interval on unmount
 }, []);


 // Function to send message to Arduino
 const sendMessageToArduino = async () => {
   if (message.trim()) {
     try {
       const response = await fetch('http://192.168.2.38/sendMessage', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message }),
       });


       if (response.ok) {
         setMessage('');
         setTerminalData((prev) => prev + '\nSent: ' + message);
       } else {
         setErrorMessage('Failed to send message');
       }
     } catch (error) {
       setErrorMessage('Error sending message');
     }
   }
 };


 return (
   <View style={styles.tabContainer}>
     <Text style={styles.tabTitle}>Serial Terminal</Text>
     {errorMessage ? (
       <Text style={styles.errorMessage}>{errorMessage}</Text>
     ) : (
       <ScrollView style={styles.terminalData}>
         <Text style={styles.terminalText}>{terminalData}</Text>
       </ScrollView>
     )}
     <TextInput
       style={styles.textInput}
       placeholder="Enter message to send"
       value={message}
       onChangeText={setMessage}
     />
     <TouchableOpacity onPress={sendMessageToArduino} style={styles.button}>
       <Text style={styles.buttonText}>Send Message</Text>
     </TouchableOpacity>
   </View>
 );
};


// Network Information Tab
const NetworkInfoTab = () => {
 const networkInfo = {
   ssid: 'BELL630', // Replace with the actual SSID you want to display
   link: 'http://192.168.2.38', // Replace with the actual network link
 };


 return (
   <View style={styles.tabContainer}>
     <Text style={styles.tabTitle}>Network Information</Text>
     <Text style={styles.networkInfo}>SSID: {networkInfo.ssid}</Text>
     <Text style={styles.networkInfo}>Network Link: {networkInfo.link}</Text>
   </View>
 );
};


// Motor Control Tab
const MotorControlTab = () => {
 const [motorSpeed, setMotorSpeed] = useState(0);


 const increaseMotorSpeed = () => setMotorSpeed((prev) => prev + 10);
 const decreaseMotorSpeed = () => setMotorSpeed((prev) => prev - 10);


 return (
   <View style={styles.tabContainer}>
     <Text style={styles.tabTitle}>Motor Control</Text>
     <Text style={styles.motorSpeed}>Motor Speed: {motorSpeed}</Text>
     <View style={styles.buttonContainer}>
       <TouchableOpacity onPress={increaseMotorSpeed} style={styles.largeButton}>
         <Text style={styles.buttonText}>+</Text>
       </TouchableOpacity>
       <TouchableOpacity onPress={decreaseMotorSpeed} style={styles.largeButton}>
         <Text style={styles.buttonText}>-</Text>
       </TouchableOpacity>
     </View>
   </View>
 );
};


// Settings Tab
const SettingsTab = () => {
 const [isAutoConnect, setIsAutoConnect] = useState(true);
 const [isSoundEnabled, setIsSoundEnabled] = useState(false);


 const toggleAutoConnect = () => setIsAutoConnect(!isAutoConnect);
 const toggleSound = () => setIsSoundEnabled(!isSoundEnabled);


 return (
   <View style={styles.tabContainer}>
     <Text style={styles.tabTitle}>Settings</Text>
     <View style={styles.settingsContainer}>
       <Text style={styles.settingsText}>Auto Connect: </Text>
       <Switch
         value={isAutoConnect}
         onValueChange={toggleAutoConnect}
         trackColor={{ false: '#767577', true: '#81b0ff' }}
         thumbColor={isAutoConnect ? '#f5dd4b' : '#f4f3f4'}
       />
     </View>


     <View style={styles.settingsContainer}>
       <Text style={styles.settingsText}>Enable Sound: </Text>
       <Switch
         value={isSoundEnabled}
         onValueChange={toggleSound}
         trackColor={{ false: '#767577', true: '#81b0ff' }}
         thumbColor={isSoundEnabled ? '#f5dd4b' : '#f4f3f4'}
       />
     </View>
   </View>
 );
};


// Main App
const App = () => {
 return (
   <NavigationContainer>
     <Tab.Navigator
       screenOptions={{
         headerShown: false,
         tabBarStyle: {
           backgroundColor: '#000', // Black background for the tab bar
           borderTopWidth: 0,
           height: 60,
         },
       }}
     >
       <Tab.Screen
         name="Network"
         component={NetworkInfoTab}
         options={{
           tabBarIcon: () => <Ionicons name="wifi" size={24} color="#fff" />,
         }}
       />
       <Tab.Screen
         name="Terminal"
         component={SerialTerminalTab}
         options={{
           tabBarIcon: () => <Ionicons name="terminal" size={24} color="#fff" />,
         }}
       />
       <Tab.Screen
         name="Motor"
         component={MotorControlTab}
         options={{
           tabBarIcon: () => <Ionicons name="speedometer" size={24} color="#fff" />,
         }}
       />
       <Tab.Screen
         name="Settings"
         component={SettingsTab}
         options={{
           tabBarIcon: () => <Ionicons name="settings" size={24} color="#fff" />,
         }}
       />
     </Tab.Navigator>
   </NavigationContainer>
 );
};


// Styles
const styles = StyleSheet.create({
 tabContainer: {
   flex: 1,
   alignItems: 'center',
   justifyContent: 'center',
   backgroundColor: '#000', // Black background for the entire tab container
 },
 tabTitle: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#fff',
   marginBottom: 20,
 },
 button: {
   backgroundColor: '#4CAF50',
   padding: 10,
   borderRadius: 5,
   marginBottom: 10,
 },
 buttonText: {
   fontSize: 18,
   color: '#fff',
 },
 textInput: {
   height: 40,
   borderColor: '#fff',
   borderWidth: 1,
   marginBottom: 10,
   paddingHorizontal: 10,
   color: '#fff',
   width: '80%',
 },
 motorSpeed: {
   fontSize: 24,
   color: '#fff',
 },
 settingsContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'center',
   marginVertical: 10,
 },
 settingsText: {
   fontSize: 18,
   color: '#fff',
 },
 largeButton: {
   backgroundColor: '#4CAF50',
   padding: 20,
   borderRadius: 5,
   margin: 10,
 },
 errorMessage: {
   color: 'red',
   fontSize: 16,
 },
 terminalData: {
   padding: 10,
   backgroundColor: '#333',
   flex: 1,
   marginBottom: 20,
 },
 terminalText: {
   fontSize: 16,
   color: '#fff',
 },
 networkInfo: {
   fontSize: 18,
   color: '#fff',
   textAlign: 'center',
 },
});


export default App;
