import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';


const App = () => {
 const [ssid, setSsid] = useState('');
 const [password, setPassword] = useState('');
 const [status, setStatus] = useState('');
 const [loading, setLoading] = useState(false);
 const [terminalData, setTerminalData] = useState('');
 const [connected, setConnected] = useState(false);


 const sendCredentials = async () => {
   setLoading(true);
   setStatus('Sending credentials...') ;
   if (ssid === '' || password === '') {
     setStatus('Please enter both SSID and Password.');
     setLoading(false);
     return;
   }


   try {
     const formData = new FormData();
     formData.append('ssid', ssid);
     formData.append('password', password);


     const response = await axios.post('http://192.168.4.1/set', formData, {
       headers: { 'Content-Type': 'multipart/form-data' },
     });


     if (response.status === 200) {
       setStatus('Credentials sent successfully!');
       setConnected(true);
       fetchData(); // Start fetching data after connection
     } else {
       setStatus('Failed to send credentials.');
     }
   } catch (error) {
     console.error('Error sending credentials:', error);
     setStatus('Error sending credentials.');
   } finally {
     setLoading(false);
   }
 };


 // Fetch sensor data continuously from the ESP32
 const fetchData = async () => {
   try {
     const response = await axios.get('http://192.168.4.1/data');
     setTerminalData(response.data);
   } catch (error) {
     console.error('Error fetching data:', error);
     setTerminalData('Error fetching data.');
   }
 };


 useEffect(() => {
   if (connected) {
     const interval = setInterval(fetchData, 5000); // Fetch data every 5 seconds
     return () => clearInterval(interval); // Cleanup interval
   }
 }, [connected]);


 return (
   <View style={styles.container}>
     <Text style={styles.header}>Enter Wi-Fi Credentials</Text>


     <TextInput
       style={styles.input}
       placeholder="Enter Wi-Fi SSID"
       value={ssid}
       onChangeText={setSsid}
     />
     <TextInput
       style={styles.input}
       placeholder="Enter Wi-Fi Password"
       secureTextEntry
       value={password}
       onChangeText={setPassword}
     />


     <Button title="Send Credentials" onPress={sendCredentials} />


     {loading && <ActivityIndicator size="large" color="#0000ff" />}
     <Text style={styles.status}>{status}</Text>


     {connected && (
       <ScrollView style={styles.terminalBox}>
         <Text>{terminalData}</Text>
       </ScrollView>
     )}
   </View>
 );
};


const styles = StyleSheet.create({
 container: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
   padding: 20,
 },
 header: {
   fontSize: 24,
   marginBottom: 20,
 },
 input: {
   height: 40,
   borderColor: '#ddd',
   borderWidth: 1,
   marginBottom: 10,
   paddingHorizontal: 10,
   width: '100%',
 },
 status: {
   marginTop: 20,
   fontSize: 16,
   color: 'gray',
 },
 terminalBox: {
   marginTop: 20,
   padding: 10,
   borderColor: '#ddd',
   borderWidth: 1,
   width: '100%',
   height: 200,
   backgroundColor: '#f0f0f0',
 },
});


export default App;


