import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../hooks/redux';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAppSelector(state => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Refresh data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const quickActions = [
    {
      title: 'Check In',
      description: 'Mark your presence at The Temple',
      action: () => navigation.navigate('Check In' as never),
      color: '#8B5A83',
      icon: '📍',
    },
    {
      title: 'Submit Credits',
      description: 'Claim credits for helping customers',
      action: () => navigation.navigate('Credits' as never),
      color: '#4CAF50',
      icon: '💰',
    },
    {
      title: 'Community',
      description: 'Connect with other members',
      action: () => navigation.navigate('Community' as never),
      color: '#2196F3',
      icon: '👥',
    },
    {
      title: 'Whiteboard',
      description: 'Collaborate in real-time',
      action: () => navigation.navigate('Whiteboard' as never),
      color: '#FF9800',
      icon: '📝',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.firstName || 'Member'}! 🏛️
        </Text>
        <Text style={styles.subtitle}>
          Ready to contribute to our healing community?
        </Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              onPress={action.action}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Activity</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Check-ins This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>$0</Text>
            <Text style={styles.statLabel}>Credits Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Community Posts</Text>
          </View>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityPlaceholder}>
          <Text style={styles.placeholderText}>No recent activity</Text>
          <Text style={styles.placeholderSubtext}>
            Start by checking in or submitting credits!
          </Text>
        </View>
      </View>
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
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    gap: 10,
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5A83',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentActivity: {
    padding: 20,
    paddingTop: 0,
  },
  activityPlaceholder: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default HomeScreen;