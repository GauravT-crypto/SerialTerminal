import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BleManager, Device } from 'react-native-ble-plx';

const manager = new BleManager();

// Bluetooth Connection Tab
const BluetoothConnectionTab = ({ onDeviceConnected }: any) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [deviceName, setDeviceName] = useState('No device connected');

  useEffect(() => {
    const handleStateChange = (state: string) => {
      if (state === 'PoweredOn') {
        toggleScan();
      }
    };

    manager.onStateChange(handleStateChange, true);

    return () => {
      manager.onStateChange(() => {}, true);
    };
  }, []);

  const toggleScan = () => {
    if (isScanning) {
      setIsScanning(false);
      manager.stopDeviceScan();
    } else {
      setIsScanning(true);
      setDevices([]);
      manager.startDeviceScan([], null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }
        if (device) {
          setDevices((prevDevices) => {
            if (!prevDevices.some((d) => d.id === device.id)) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });
    }
  };

  const connectToDevice = (device: Device) => {
    if (connectedDevice && connectedDevice.id === device.id) {
      Alert.alert('Already Connected', 'You are already connected to this device.');
      return;
    }

    setDeviceName('Connecting...');
    const connectionTimeout = setTimeout(() => {
      setDeviceName('Connection Timeout');
      Alert.alert('Connection Error', 'The connection attempt timed out.');
    }, 10000);

    device.connect()
      .then((connected) => {
        clearTimeout(connectionTimeout);
        setDeviceName(connected.name || 'Unknown Device');
        setConnectedDevice(connected);
        onDeviceConnected(connected);
        return connected.discoverAllServicesAndCharacteristics();
      })
      .catch((error) => {
        clearTimeout(connectionTimeout);
        setDeviceName('Connection Error');
        Alert.alert('Connection Error', 'Unable to connect to the device.');
      });
  };

  const disconnectDevice = () => {
    if (connectedDevice) {
      connectedDevice.cancelConnection()
        .then(() => {
          setDeviceName('No device connected');
          setConnectedDevice(null);
          Alert.alert('Disconnected', 'The device has been disconnected.');
        })
        .catch((error) => {
          Alert.alert('Disconnection Error', 'Unable to disconnect from the device.');
        });
    } else {
      Alert.alert('No device connected', 'There is no device to disconnect.');
    }
  };

  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>Bluetooth Connection</Text>
      <Text style={styles.deviceLabel}>Connected to: {deviceName}</Text>

      <TouchableOpacity onPress={toggleScan} style={styles.button}>
        <Text style={styles.buttonText}>{isScanning ? 'Stop Scanning' : 'Start Scanning'}</Text>
      </TouchableOpacity>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => connectToDevice(item)} style={styles.deviceItem}>
            <Text style={styles.deviceName}>{item.name || 'Unnamed Device'}</Text>
          </TouchableOpacity>
        )}
        style={styles.deviceList}
      />

      <TouchableOpacity onPress={disconnectDevice} style={styles.button}>
        <Text style={styles.buttonText}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );
};

// Serial Terminal Tab
const SerialTerminalTab = ({ connectedDevice }: any) => {
  const [terminalData, setTerminalData] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (connectedDevice) {
      const serviceUUID = '12345678-1234-1234-1234-123456789abc'; // Replace with correct UUID
      const characteristicUUID = 'b90f3039-3347-4292-8f2e-f9c63e58d597'; // Replace with correct UUID

      const enableNotifications = async () => {
        try {
          await connectedDevice.readCharacteristicForService(serviceUUID, characteristicUUID);

          connectedDevice.monitorCharacteristicForService(
            serviceUUID,
            characteristicUUID,
            (error, characteristic) => {
              if (error) {
                setErrorMessage(`Error while reading data: ${error.message}`);
                return;
              }
              if (characteristic && characteristic.value) {
                const value = characteristic.value;
                const decodedValue = Buffer.from(value, 'base64').toString('utf8');
                setTerminalData((prev) => prev + decodedValue + '\n');
              }
            }
          );
        } catch (error) {
          setErrorMessage(`Failed to enable notifications: ${error.message}`);
        }
      };

      enableNotifications();

      return () => {
        connectedDevice.cancelNotificationForCharacteristic(serviceUUID, characteristicUUID);
      };
    }
  }, [connectedDevice]);

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

  const toggleAutoConnect = () => setIsAutoConnect(!isAutoConnect);

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
    </View>
  );
};

const Tab = createBottomTabNavigator();

const App = () => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const handleDeviceConnected = useCallback((device: Device) => {
    setConnectedDevice(device);
  }, []);

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
          name="Connection"
          children={() => <BluetoothConnectionTab onDeviceConnected={handleDeviceConnected} />}
          options={{
            tabBarIcon: () => <Ionicons name="bluetooth" size={24} color="#fff" />,
          }}
        />
        <Tab.Screen
          name="Terminal"
          children={() => <SerialTerminalTab connectedDevice={connectedDevice} />}
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
  deviceList: {
    width: '100%',
  },
  deviceItem: {
    padding: 15,
    backgroundColor: '#333',
    marginBottom: 5,
    borderRadius: 5,
  },
  deviceName: {
    fontSize: 18,
    color: '#fff',
  },
  deviceLabel: {
    fontSize: 18,
    color: '#fff',
  },
  motorSpeed: {
    fontSize: 24,
    color: '#fff',
  },
  settingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  terminalText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default App;
