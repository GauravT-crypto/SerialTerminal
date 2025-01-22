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
        console.log('Discovered device:', device.name, device.id);
        if (!devices.find(d => d.id === device.id)) {
          setDevices(prevDevices => [...prevDevices, device]);
        }
      }
    });
  };

  const stopScanning = () => {
    setIsScanning(false);
    manager.stopDeviceScan();
  };

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
            setTerminalData(prevData => prevData + '\n' + value);
          }
        });
      })
      .catch((error) => {
        console.error('Failed to connect or discover services:', error);
      });
  };

  const extractLuxValue = (data) => {
    // Check if data is a string that starts with "Lux:"
    if (data.startsWith("Lux:")) {
      const luxValue = data.split("Lux:")[1].trim(); // Extract the value after "Lux:"
      return luxValue ? parseFloat(luxValue) : null;
    }
    return null;
  };

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
    justifyContent: 'space-between',
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
  scanningText: {
    fontSize: 16,
    color: 'blue',
    marginBottom: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    marginTop: 20,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    marginBottom: 20,
  },
  terminalText: {
    color: 'white',
    fontFamily: 'Courier New',
    fontSize: 14,
  },
});

export default App;
