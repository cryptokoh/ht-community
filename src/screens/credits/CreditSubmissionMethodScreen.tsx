import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const CreditSubmissionMethodScreen = () => {
  const navigation = useNavigation();

  const submissionMethods = [
    {
      id: 'voice',
      title: 'Voice Submission',
      subtitle: 'Talk naturally about your assistance',
      description: 'Just speak naturally and let AI ask follow-up questions',
      icon: 'record-voice-over',
      color: '#4CAF50',
      pros: ['Natural conversation', 'Hands-free', 'AI asks questions'],
      cons: ['Requires microphone', 'Needs quiet environment'],
      route: 'VoiceCredit',
      recommended: true,
    },
    {
      id: 'text-ai',
      title: 'Text AI Submission',
      subtitle: 'Type and let AI help process',
      description: 'Write a description and AI will extract details',
      icon: 'chat',
      color: '#2196F3',
      pros: ['No voice needed', 'AI processing', 'Quick typing'],
      cons: ['Requires typing', 'May need follow-up questions'],
      route: 'TextCreditAI',
    },
    {
      id: 'manual',
      title: 'Manual Form',
      subtitle: 'Traditional structured form',
      description: 'Fill out detailed form fields yourself',
      icon: 'assignment',
      color: '#8B5A83',
      pros: ['Complete control', 'All options visible', 'Works offline'],
      cons: ['More time consuming', 'Requires all details'],
      route: 'ManualCredit',
    },
  ];

  const navigateToMethod = (route: string) => {
    navigation.navigate(route as never);
  };

  const renderMethodCard = (method: typeof submissionMethods[0]) => (
    <View key={method.id} style={styles.methodCard}>
      {method.recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}
      
      <View style={styles.methodHeader}>
        <View style={[styles.iconContainer, { backgroundColor: method.color }]}>
          <Icon name={method.icon} size={28} color="#fff" />
        </View>
        <View style={styles.methodTitleContainer}>
          <Text style={styles.methodTitle}>{method.title}</Text>
          <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
        </View>
      </View>

      <Text style={styles.methodDescription}>{method.description}</Text>

      <View style={styles.prosConsContainer}>
        <View style={styles.prosContainer}>
          <Text style={styles.prosConsTitle}>✅ Pros:</Text>
          {method.pros.map((pro, index) => (
            <Text key={index} style={styles.prosConsItem}>• {pro}</Text>
          ))}
        </View>
        <View style={styles.consContainer}>
          <Text style={styles.prosConsTitle}>⚠️ Considerations:</Text>
          {method.cons.map((con, index) => (
            <Text key={index} style={styles.prosConsItem}>• {con}</Text>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.selectButton, { backgroundColor: method.color }]}
        onPress={() => navigateToMethod(method.route)}
      >
        <Text style={styles.selectButtonText}>Choose This Method</Text>
        <Icon name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="account-balance-wallet" size={32} color="#8B5A83" />
        <Text style={styles.title}>Submit Credit Claim</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to submit your sales assistance claim
        </Text>
      </View>

      <View style={styles.methodsContainer}>
        {submissionMethods.map(renderMethodCard)}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 Not sure which method to use?</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>New to the app?</Text> Try Voice Submission - it's the most natural way to describe your assistance.
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>In a quiet place?</Text> Voice or Text AI work great for quick submissions.
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Want full control?</Text> Manual Form lets you specify every detail precisely.
          </Text>
        </View>
      </View>

      <View style={styles.creditInfo}>
        <Text style={styles.creditInfoTitle}>Credit Rates</Text>
        <View style={styles.creditRateItem}>
          <Text style={styles.creditRate}>3%</Text>
          <Text style={styles.creditRateDescription}>Simple product recommendations</Text>
        </View>
        <View style={styles.creditRateItem}>
          <Text style={styles.creditRate}>7%</Text>
          <Text style={styles.creditRateDescription}>Customer assistance & guidance</Text>
        </View>
        <View style={styles.creditRateItem}>
          <Text style={styles.creditRate}>12%</Text>
          <Text style={styles.creditRateDescription}>Detailed consultations & education</Text>
        </View>
        <View style={styles.creditRateItem}>
          <Text style={styles.creditRate}>18%</Text>
          <Text style={styles.creditRateDescription}>Complex problem solving & custom solutions</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  methodsContainer: {
    padding: 16,
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodTitleContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  methodDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
    lineHeight: 22,
  },
  prosConsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  prosContainer: {
    flex: 1,
    marginRight: 8,
  },
  consContainer: {
    flex: 1,
    marginLeft: 8,
  },
  prosConsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  prosConsItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  infoSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: 'bold',
    color: '#333',
  },
  creditInfo: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  creditInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  creditRateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditRate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    width: 40,
  },
  creditRateDescription: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
});

export default CreditSubmissionMethodScreen;