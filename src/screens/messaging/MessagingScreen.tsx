import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

const MessagingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // Mock conversations data
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'Temple Staff',
      lastMessage: 'Welcome to The Healing Temple!',
      timestamp: '2h ago',
      unreadCount: 1,
      isOnline: true,
    },
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Refresh conversations
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderConversation = (conversation: Conversation) => (
    <TouchableOpacity
      key={conversation.id}
      style={styles.conversationCard}
      onPress={() => {
        // TODO: Navigate to chat screen
        console.log('Open conversation:', conversation.id);
      }}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, conversation.isOnline && styles.onlineAvatar]}>
          <Text style={styles.avatarText}>
            {conversation.name.charAt(0)}
          </Text>
        </View>
        {conversation.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{conversation.name}</Text>
          <Text style={styles.timestamp}>{conversation.timestamp}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {conversation.lastMessage}
        </Text>
      </View>
      
      {conversation.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Connect with the community</Text>
      </View>

      <View style={styles.content}>
        {conversations.length > 0 ? (
          <View style={styles.conversationsSection}>
            <Text style={styles.sectionTitle}>Conversations</Text>
            {conversations.map(renderConversation)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start connecting with other community members!
            </Text>
          </View>
        )}

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Community Features</Text>
          
          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>👥</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Group Chats</Text>
              <Text style={styles.featureDescription}>
                Join topic-based discussions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>📢</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Announcements</Text>
              <Text style={styles.featureDescription}>
                Stay updated with temple news
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Direct Messages</Text>
              <Text style={styles.featureDescription}>
                Private conversations with members
              </Text>
            </View>
          </TouchableOpacity>
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
    backgroundColor: '#9C27B0',
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
  content: {
    padding: 20,
  },
  conversationsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  conversationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineAvatar: {
    backgroundColor: '#4CAF50',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#F44336',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default MessagingScreen;