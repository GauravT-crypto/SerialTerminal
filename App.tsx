import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import axios from 'axios';

const App = () => {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [lux, setLux] = useState('No data');
  const [temperature, setTemperature] = useState('No data');
  const [humidity, setHumidity] = useState('No data');
  const [dataSentStatus, setDataSentStatus] = useState(''); // New state for data sent status
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('wifi');
  const [motorSpeed, setMotorSpeed] = useState(0); // For motor control

  // Effect hook to fetch data every 5 seconds when connected
  useEffect(() => {
    if (connected) {
      console.log('Fetching data every 5 seconds...');
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval); // Clean up interval on unmount or when disconnected
    }
  }, [connected]);

  // Function to send Wi-Fi credentials
  const sendCredentials = async () => {
    setLoading(true);
    setStatus('Sending credentials...');
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
        setConnected(true); // Start fetching data after successful connection
      } else {
        setStatus('Failed to send credentials.');
      }
    } catch (error) {
      console.error('Error sending credentials:', error);
      setStatus('Error sending credentials: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch data from the server
  const fetchData = async () => {
    try {
      const response = await axios.get('http://192.168.4.1/data');
      console.log('Data received:', response.data); // Logging the full response to check data structure

      // Parse the sensor data from the response
      if (response.data) {
        const dataLines = response.data.split("\n"); // Splitting data by lines
        let luxData = "No data";
        let tempData = "No data";
        let humidityData = "No data";

        dataLines.forEach(line => {
          if (line.includes("Lux")) {
            luxData = line.split(":")[1]?.trim();
          } else if (line.includes("Temperature")) {
            tempData = line.split(":")[1]?.trim();
          } else if (line.includes("Humidity")) {
            humidityData = line.split(":")[1]?.trim();
          }
        });

        setLux(luxData);
        setTemperature(tempData);
        setHumidity(humidityData);
      } else {
        setLux('No data');
        setTemperature('No data');
        setHumidity('No data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLux('Error fetching data');
      setTemperature('Error fetching data');
      setHumidity('Error fetching data');
    }
  };

  // Motor control functions
  const increaseMotorSpeed = () => {
    setMotorSpeed(motorSpeed + 1);
  };

  const decreaseMotorSpeed = () => {
    setMotorSpeed(motorSpeed - 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          {/* Content for Wi-Fi credentials */}
          {activeTab === 'wifi' && (
            <View style={styles.tabContent}>
              <Text style={styles.header}>Enter Wi-Fi Credentials</Text>
              <View style={styles.formContainer}>
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
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={sendCredentials}
                  >
                    <Text style={styles.buttonText}>Send Data</Text>
                  </TouchableOpacity>
                </View>
                {loading && <ActivityIndicator size="large" color="#34C759" />}
                <Text style={styles.status}>{status}</Text>
              </View>
            </View>
          )}

          {/* Content for Serial Monitor Data */}
          {activeTab === 'terminal' && (
            <View style={styles.terminalContainer}>
              <Text style={styles.terminalHeader}>
                {connected ? 'Connected - Serial Terminal Data' : 'Not Connected'}
              </Text>
              <View style={styles.terminalBox}>
                <View style={styles.dataContainer}>
                  <Text style={styles.luxTitle}>Lux:</Text>
                  <TextInput
                    style={styles.input}
                    value={lux}
                    editable={false} // Makes this box read-only
                  />
                </View>
                <View style={styles.dataContainer}>
                  <Text style={styles.temperatureTitle}>Temperature:</Text>
                  <TextInput
                    style={styles.input}
                    value={temperature}
                    editable={false} // Makes this box read-only
                  />
                </View>
                <View style={styles.dataContainer}>
                  <Text style={styles.humidityTitle}>Humidity:</Text>
                  <TextInput
                    style={styles.input}
                    value={humidity}
                    editable={false} // Makes this box read-only
                  />
                </View>

                {/* Data Sent Status Box */}
                <View style={styles.dataContainer}>
                  <Text style={styles.statusTitle}>Data Sent Status:</Text>
                  <TextInput
                    style={[styles.input, { height: 50 }]} // Bigger box for status
                    value={dataSentStatus}
                    editable={false}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Other Tabs (Motor and Settings) */}
          {activeTab === 'motor' && (
            <View style={styles.tabContent}>
              <Text style={styles.header}>Motor Control</Text>
              <View style={styles.motorControls}>
                <TouchableOpacity
                  style={styles.motorButton}
                  onPress={decreaseMotorSpeed}
                >
                  <Text style={styles.motorButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.motorSpeed}>{motorSpeed}</Text>
                <TouchableOpacity
                  style={styles.motorButton}
                  onPress={increaseMotorSpeed}
                >
                  <Text style={styles.motorButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'settings' && (
            <View style={styles.tabContent}>
              <Text style={styles.header}>Settings</Text>
              <Text style={styles.settingsText}>Adjust app settings here.</Text>
            </View>
          )}
        </ScrollView>

        {/* Tabs at the bottom */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'wifi' && styles.activeTab]}
            onPress={() => setActiveTab('wifi')}
          >
            <Text style={styles.tabText}>Wi-Fi Credentials</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'terminal' && styles.activeTab]}
            onPress={() => setActiveTab('terminal')}
          >
            <Text style={styles.tabText}>Serial Terminal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'motor' && styles.activeTab]}
            onPress={() => setActiveTab('motor')}
          >
            <Text style={styles.tabText}>Motor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={styles.tabText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  formContainer: {
    alignItems: 'center',
  },
  input: {
    height: 50,
    borderColor: '#34C759',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    width: '80%',
    backgroundColor: '#2C2C2C',
    color: '#ffffff',
    fontSize: 16,
  },
  status: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    backgroundColor: '#34C759',
    borderRadius: 8,
    marginBottom: 15,
  },
  greenButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 15,
    width: '80%',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  terminalContainer: {
    backgroundColor: '#222222',
    borderRadius: 8,
    padding: 15,
    width: '80%',
  },
  terminalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ffffff',
    textAlign: 'center',
  },
  terminalBox: {
    padding: 10,
    width: '100%',
  },
  dataContainer: {
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  luxTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffffff',
  },
  temperatureTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffffff',
  },
  humidityTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffffff',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#34C759',
    backgroundColor: '#222222',
    paddingVertical: 10,
  },
  tabButton: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#34C759',
  },
  tabText: {
    fontSize: 16,
    color: '#ffffff',
  },
  motorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motorButton: {
    backgroundColor: '#34C759',
    padding: 40, // Increased padding for bigger buttons
    margin: 10,
    borderRadius: 8,
  },
  motorButtonText: {
    color: '#ffffff',
    fontSize: 32, // Larger text for better visibility
    fontWeight: 'bold',
  },
  motorSpeed: {
    fontSize: 22,
    color: '#ffffff',
    marginHorizontal: 20,
  },
  settingsText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default App;

