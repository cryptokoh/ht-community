import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
// import { BarCodeScanner } from 'expo-barcode-scanner'; // Removed for Expo Go compatibility
import * as Location from 'expo-location';
import { useAppSelector } from '../../hooks/redux';

const { width } = Dimensions.get('window');

type CheckInMethod = 'SHOW_QR' | 'SCAN_QR' | 'GEOFENCE';

const CheckInScreen = () => {
  const { user } = useAppSelector(state => state.auth);
  const [checkInMethod, setCheckInMethod] = useState<CheckInMethod>('SHOW_QR');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);

  useEffect(() => {
    // Request location permission
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, []);


  const handleCheckIn = async (method: string, data?: string) => {
    setIsCheckingIn(true);
    try {
      // Simulate check-in process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const checkInData = {
        method,
        timestamp: new Date().toISOString(),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : null,
        data,
      };
      
      setLastCheckIn(checkInData);
      Alert.alert('Success!', 'You have successfully checked in to The Healing Temple! 🏛️');
    } catch (error) {
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const renderCheckInMethod = () => {
    switch (checkInMethod) {
      case 'SHOW_QR':
        return (
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>🏛️</Text>
              <Text style={styles.qrCodeText}>QR Code</Text>
              <Text style={styles.userIdText}>{user?.id || 'DEMO-USER'}</Text>
            </View>
            <Text style={styles.instructions}>
              Show this QR code to staff for check-in
            </Text>
          </View>
        );

      case 'SCAN_QR':
        return (
          <View style={styles.scannerContainer}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                // Demo mode - simulate QR scan
                Alert.alert(
                  'Demo Mode',
                  'QR Scanner requires a development build.\n\nFor demo, we\'ll simulate a successful scan!',
                  [
                    {
                      text: 'OK',
                      onPress: () => handleCheckIn('QR_CODE', 'DEMO-QR-CODE')
                    }
                  ]
                );
              }}
            >
              <Text style={styles.scanButtonText}>📷 Tap to Simulate Scan</Text>
            </TouchableOpacity>
            <Text style={styles.demoText}>
              (QR Scanner not available in Expo Go)
            </Text>
          </View>
        );

      case 'GEOFENCE':
        return (
          <View style={styles.geofenceContainer}>
            <Text style={styles.geofenceIcon}>📍</Text>
            <Text style={styles.geofenceText}>
              {location
                ? 'Location detected! Tap to check in.'
                : 'Detecting your location...'}
            </Text>
            {location && (
              <TouchableOpacity
                style={styles.checkInButton}
                onPress={() => handleCheckIn('GEOFENCE')}
                disabled={isCheckingIn}
              >
                <Text style={styles.checkInButtonText}>
                  {isCheckingIn ? 'Checking in...' : 'Check In Now'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Check In</Text>
        <Text style={styles.subtitle}>Mark your presence at The Healing Temple</Text>
      </View>

      <View style={styles.methodSelector}>
        <TouchableOpacity
          style={[styles.methodButton, checkInMethod === 'SHOW_QR' && styles.selectedMethod]}
          onPress={() => setCheckInMethod('SHOW_QR')}
        >
          <Text style={styles.methodIcon}>🏛️</Text>
          <Text style={styles.methodText}>Show QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodButton, checkInMethod === 'SCAN_QR' && styles.selectedMethod]}
          onPress={() => setCheckInMethod('SCAN_QR')}
        >
          <Text style={styles.methodIcon}>📷</Text>
          <Text style={styles.methodText}>Scan QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodButton, checkInMethod === 'GEOFENCE' && styles.selectedMethod]}
          onPress={() => setCheckInMethod('GEOFENCE')}
        >
          <Text style={styles.methodIcon}>📍</Text>
          <Text style={styles.methodText}>Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.methodContainer}>
        {renderCheckInMethod()}
      </View>

      {lastCheckIn && (
        <View style={styles.lastCheckInContainer}>
          <Text style={styles.lastCheckInTitle}>Last Check-in</Text>
          <Text style={styles.lastCheckInText}>
            {new Date(lastCheckIn.timestamp).toLocaleString()}
          </Text>
          <Text style={styles.lastCheckInMethod}>
            Method: {lastCheckIn.method}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#8B5A83',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  methodSelector: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
  },
  methodButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    width: width * 0.25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedMethod: {
    backgroundColor: '#8B5A83',
  },
  methodIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  methodText: {
    fontSize: 14,
    color: '#333',
  },
  methodContainer: {
    padding: 20,
    minHeight: 300,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrPlaceholderText: {
    fontSize: 60,
    marginBottom: 10,
  },
  qrCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5A83',
    marginBottom: 5,
  },
  userIdText: {
    fontSize: 12,
    color: '#666',
  },
  instructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scannerContainer: {
    height: 300,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#8B5A83',
    padding: 20,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  geofenceContainer: {
    alignItems: 'center',
    padding: 20,
  },
  geofenceIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  geofenceText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  checkInButton: {
    backgroundColor: '#8B5A83',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastCheckInContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lastCheckInTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  lastCheckInText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  lastCheckInMethod: {
    fontSize: 14,
    color: '#999',
  },
  demoText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default CheckInScreen;