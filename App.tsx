import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ScrollView } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [terminalData, setTerminalData] = useState('');
  const [manager, setManager] = useState(null);

  const SERVICE_UUID = 'f0c9bbf8-34ea-4c89-bc6e-1b495fd007d0';
  const CHARACTERISTIC_UUID = 'b90f3039-3347-4292-8f2e-f9c63e58d597';

  useEffect(() => {
    const bleManager = new BleManager();
    setManager(bleManager);

    const checkBluetoothState = () => {
      bleManager.state().then((state) => {
        console.log('Bluetooth state:', state);
        if (state === 'PoweredOff') {
          bleManager.enable().then(() => {
            console.log('Bluetooth enabled');
          }).catch((error) => {
            console.error('Error enabling Bluetooth:', error);
          });
        }
      });
    };

    checkBluetoothState();

    return () => {
      bleManager.destroy();
    };
  }, []);

  // Start scanning for Bluetooth devices
  const startScanning = () => {
    if (isScanning) return;

    setIsScanning(true);
    setDevices([]);

    console.log('Scanning started...');
    manager.startDeviceScan([], null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        return;
      }

      if (device) {
        console.log('Discovered device:', device.name);

        // Add discovered device to list if not already in the list
        setDevices(prevDevices => {
          if (!prevDevices.find(d => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });
  };

  // Stop scanning for devices
  const stopScanning = () => {
    setIsScanning(false);
    manager.stopDeviceScan();
  };

  // Connect to the selected device
  const connectToDevice = (device) => {
    console.log('Connecting to:', device.name);

    device
      .connect()
      .then((connectedDevice) => {
        console.log('Connected to:', connectedDevice.name);
        setConnectedDevice(connectedDevice);
        return connectedDevice.discoverAllServicesAndCharacteristics();
      })
      .then((connectedDevice) => {
        console.log('Services and characteristics discovered');
        return connectedDevice.monitorCharacteristicForService(SERVICE_UUID, CHARACTERISTIC_UUID, (error, characteristic) => {
          if (error) {
            console.error('Monitor error:', error);
            return;
          }
          if (characteristic.value) {
            const value = Buffer.from(characteristic.value, 'base64').toString();
            console.log('Received data:', value); // Log the received data
            setTerminalData((prevData) => prevData + '\n' + value);
          }
        });
      })
      .catch((error) => {
        console.error('Failed to connect or discover services:', error);
      });
  };

  // Disconnect from the currently connected device
  const disconnectFromDevice = () => {
    if (connectedDevice) {
      connectedDevice
        .cancelConnection()
        .then(() => {
          console.log('Disconnected from device');
          setConnectedDevice(null);
          setTerminalData('');
        })
        .catch((error) => {
          console.error('Failed to disconnect', error);
        });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Scanner</Text>

      <Button
        title={isScanning ? 'Stop Scanning' : 'Start Scanning'}
        onPress={isScanning ? stopScanning : startScanning}
      />

      {isScanning && <Text style={styles.scanningText}>Scanning for devices...</Text>}

      {/* List of discovered device names */}
      <FlatList
        data={devices}
        renderItem={({ item }) => (
          <View style={styles.deviceItem}>
            <Text style={styles.deviceName}>
              {item.name ? item.name : 'Unknown Device'}
            </Text>
            <Button title="Connect" onPress={() => connectToDevice(item)} />
          </View>
        )}
        keyExtractor={item => item.id}
      />

      {/* Connected device info */}
      {connectedDevice && (
        <View style={styles.connectedContainer}>
          <Text style={styles.connectedText}>Connected to: {connectedDevice.name}</Text>
          <Button title="Disconnect" onPress={disconnectFromDevice} />
        </View>
      )}

      {/* Terminal for displaying received data */}
      {connectedDevice && (
        <ScrollView style={styles.terminalContainer}>
          <Text style={styles.terminalText}>{terminalData}</Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    justifyContent: 'space-between',  // Ensure the content is spread out
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scanningText: {
    fontSize: 16,
    color: 'blue',
    marginBottom: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 10,
  },
  deviceName: {
    fontSize: 18,
    color: 'white',  
  },
  connectedContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  connectedText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  terminalContainer: {
    height: 200, // Fixed height for the terminal
    marginTop: 20,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    marginBottom: 20,
  },
  terminalText: {
    color: '#fff',
    fontFamily: 'Courier New',
    fontSize: 14,
  },
});

export default App;
