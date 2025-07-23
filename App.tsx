import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const handleLogin = () => {
    if (email && password) {
      Alert.alert('Success!', 'Welcome to The Healing Temple! 🏛️');
      setIsLoggedIn(true);
    } else {
      Alert.alert('Error', 'Please enter email and password');
    }
  };

  const handleQuickLogin = () => {
    setEmail('demo@temple.com');
    setPassword('demo123');
    Alert.alert('Success!', 'Welcome to The Healing Temple! 🏛️');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: () => {
            setIsLoggedIn(false);
            setEmail('');
            setPassword('');
            setActiveTab('home');
          },
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.loginContainer}>
            <Text style={styles.logo}>🏛️</Text>
            <Text style={styles.title}>The Healing Temple</Text>
            <Text style={styles.subtitle}>Community App Demo</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.buttonPressed
              ]}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                { backgroundColor: '#4CAF50' },
                pressed && styles.buttonPressed
              ]}
              onPress={handleQuickLogin}
            >
              <Text style={styles.buttonText}>🚀 Quick Demo Login</Text>
            </Pressable>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                This is a demo app. Use any email/password or Quick Demo Login!
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>The Healing Temple</Text>
        <Text style={styles.headerSubtitle}>Welcome, {email.split('@')[0]}!</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'home' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>🏛️ Home</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome to The Healing Temple!</Text>
              <Text style={styles.cardText}>
                Your community app for check-ins, credits, and connections.
              </Text>
            </View>
            <Pressable 
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => Alert.alert('Check In', 'Check-in feature coming soon!')}
            >
              <Text style={styles.actionButtonText}>📍 Check In Now</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'checkin' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>📍 Check In</Text>
            <Pressable 
              style={({ pressed }) => [
                styles.checkInMethod,
                pressed && styles.methodPressed
              ]}
              onPress={() => Alert.alert('QR Code', 'Show your QR code to staff')}
            >
              <Text style={styles.methodIcon}>🏛️</Text>
              <Text style={styles.methodText}>Show QR Code</Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [
                styles.checkInMethod,
                pressed && styles.methodPressed
              ]}
              onPress={() => Alert.alert('Demo Mode', 'QR Scanner requires development build')}
            >
              <Text style={styles.methodIcon}>📷</Text>
              <Text style={styles.methodText}>Scan QR Code</Text>
            </Pressable>
            <Pressable 
              style={({ pressed }) => [
                styles.checkInMethod,
                pressed && styles.methodPressed
              ]}
              onPress={() => Alert.alert('Location', 'Checking your location...')}
            >
              <Text style={styles.methodIcon}>📍</Text>
              <Text style={styles.methodText}>Location Check-in</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'credits' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>💰 Credits</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Current Balance</Text>
              <Text style={styles.balanceAmount}>$0.00</Text>
            </View>
            <Pressable 
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => Alert.alert('Credits', 'Submit credit claim')}
            >
              <Text style={styles.actionButtonText}>Submit Credit Claim</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>👤 Profile</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.profileIcon}>👤</Text>
              <Text style={styles.profileName}>{email.split('@')[0]}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
            <Pressable 
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.buttonPressed
              ]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={styles.bottomTabs}>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'home' && styles.activeTab,
            pressed && styles.tabPressed
          ]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={styles.tabIcon}>🏛️</Text>
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'checkin' && styles.activeTab,
            pressed && styles.tabPressed
          ]}
          onPress={() => setActiveTab('checkin')}
        >
          <Text style={styles.tabIcon}>📍</Text>
          <Text style={styles.tabLabel}>Check In</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'credits' && styles.activeTab,
            pressed && styles.tabPressed
          ]}
          onPress={() => setActiveTab('credits')}
        >
          <Text style={styles.tabIcon}>💰</Text>
          <Text style={styles.tabLabel}>Credits</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'profile' && styles.activeTab,
            pressed && styles.tabPressed
          ]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loginContainer: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5A83',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#8B5A83',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  infoBox: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#8B5A83',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  tabTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkInMethod: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  methodPressed: {
    backgroundColor: '#e0e0e0',
  },
  methodIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  methodText: {
    fontSize: 18,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#f0f0f0',
  },
  tabPressed: {
    backgroundColor: '#e0e0e0',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
  },
});