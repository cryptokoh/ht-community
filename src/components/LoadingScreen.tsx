import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  showLogo = true 
}) => {
  return (
    <View style={styles.container}>
      {showLogo && (
        <View style={styles.logoContainer}>
          {/* Placeholder for logo - replace with actual logo when available */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🏛️</Text>
            <Text style={styles.appName}>The Healing Temple</Text>
          </View>
        </View>
      )}
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color="#8B5A83" 
          style={styles.spinner}
        />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Connecting your community</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  logoText: {
    fontSize: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5A83',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default LoadingScreen;