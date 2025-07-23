import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const CreditSubmissionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const submissionMethods = [
    {
      id: 'manual',
      title: 'Manual Entry',
      description: 'Type your credit claim manually',
      icon: '✍️',
      available: true,
    },
    {
      id: 'voice',
      title: 'Voice Submission',
      description: 'Speak your credit claim',
      icon: '🎤',
      available: true,
    },
    {
      id: 'ai',
      title: 'AI Assistant',
      description: 'Let Claude help process your claim',
      icon: '🤖',
      available: true,
    },
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    
    switch (methodId) {
      case 'manual':
        navigation.navigate('ManualCreditSubmission' as never);
        break;
      case 'voice':
        navigation.navigate('VoiceCreditSubmission' as never);
        break;
      case 'ai':
        Alert.alert(
          'AI Assistant',
          'AI-powered credit submission coming soon!',
          [{ text: 'OK' }]
        );
        break;
      default:
        break;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Submit Credit Claim</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to submit your credit claim
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Submission Methods</Text>
          {submissionMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.selectedMethod,
                !method.available && styles.disabledMethod,
              ]}
              onPress={() => method.available && handleMethodSelect(method.id)}
              disabled={!method.available}
            >
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>{method.title}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
                {!method.available && (
                  <Text style={styles.comingSoon}>Coming Soon</Text>
                )}
              </View>
              <Text style={styles.methodArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • Describe the assistance you provided to customers{'\n'}
              • Our AI system will analyze your claim{'\n'}
              • Credits are awarded based on verification{'\n'}
              • Track your earnings in real-time
            </Text>
          </View>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips for Better Claims</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              💡 Be specific about what you helped with{'\n'}
              ⏰ Submit claims promptly after helping{'\n'}
              📝 Include customer details when possible{'\n'}
              🎯 Focus on actual sales assistance provided
            </Text>
          </View>
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
    backgroundColor: '#4CAF50',
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
  methodsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  methodCard: {
    backgroundColor: '#fff',
    padding: 20,
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
  selectedMethod: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  disabledMethod: {
    opacity: 0.6,
  },
  methodIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
  },
  comingSoon: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
    marginTop: 4,
  },
  methodArrow: {
    fontSize: 20,
    color: '#4CAF50',
  },
  infoSection: {
    marginBottom: 25,
  },
  infoCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
});

export default CreditSubmissionScreen;