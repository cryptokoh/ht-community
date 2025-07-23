import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppSelector } from '../../hooks/redux';
import { CreditService } from '../../services/CreditService';

interface ManualSubmissionData {
  assistanceType: string;
  productCategory: string;
  customerType: string;
  saleValue: string;
  timeOfSale: Date;
  description: string;
  additionalNotes: string;
}

const ManualCreditSubmissionScreen = () => {
  const { user } = useAppSelector(state => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [formData, setFormData] = useState<ManualSubmissionData>({
    assistanceType: 'assistance',
    productCategory: '',
    customerType: 'new',
    saleValue: '',
    timeOfSale: new Date(),
    description: '',
    additionalNotes: '',
  });

  const assistanceTypes = [
    { value: 'recommendation', label: 'Simple Recommendation (3%)', rate: 0.03 },
    { value: 'assistance', label: 'Customer Assistance (7%)', rate: 0.07 },
    { value: 'consultation', label: 'Detailed Consultation (12%)', rate: 0.12 },
    { value: 'problem_solving', label: 'Problem Solving (18%)', rate: 0.18 },
  ];

  const productCategories = [
    'Crystals & Stones',
    'Essential Oils',
    'Candles',
    'Incense',
    'Yoga Equipment',
    'Books',
    'Jewelry',
    'Sage & Smudging',
    'Teas & Herbs',
    'Meditation Tools',
    'Other',
  ];

  const customerTypes = [
    { value: 'new', label: 'New Customer', multiplier: 1.3 },
    { value: 'returning', label: 'Returning Customer', multiplier: 1.1 },
    { value: 'member', label: 'Community Member', multiplier: 1.0 },
  ];

  const handleInputChange = (field: keyof ManualSubmissionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateEstimatedCredit = (): number => {
    const assistanceType = assistanceTypes.find(t => t.value === formData.assistanceType);
    const customerType = customerTypes.find(t => t.value === formData.customerType);
    const saleValue = parseFloat(formData.saleValue) || 0;

    if (!assistanceType || saleValue <= 0) return 0;

    let baseCredit = saleValue * assistanceType.rate;
    baseCredit *= customerType?.multiplier || 1.0;

    // Member tier bonus
    if (user?.memberTier === 'PREMIUM') baseCredit *= 1.2;
    if (user?.memberTier === 'VIP') baseCredit *= 1.5;

    // Cap at reasonable amount
    return Math.min(Math.round(baseCredit * 100) / 100, 100);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please provide a description of your assistance.');
      return;
    }

    if (!formData.productCategory) {
      Alert.alert('Validation Error', 'Please select a product category.');
      return;
    }

    if (!formData.saleValue || parseFloat(formData.saleValue) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid sale value.');
      return;
    }

    try {
      setIsSubmitting(true);

      const estimatedCredit = calculateEstimatedCredit();
      
      const submissionData = {
        rawInput: `Manual submission: ${formData.description}`,
        processedData: {
          assistanceType: formData.assistanceType,
          productCategory: formData.productCategory,
          customerType: formData.customerType,
          saleValue: parseFloat(formData.saleValue),
          timeOfSale: formData.timeOfSale.toISOString(),
          description: formData.description,
          additionalNotes: formData.additionalNotes,
          submissionMethod: 'manual_form',
          confidence: 0.95, // High confidence for manual submissions
        },
        assistanceType: formData.assistanceType,
        confidenceScore: 0.95,
        claimedAmount: estimatedCredit,
      };

      await CreditService.submitManualCredit(submissionData);

      Alert.alert(
        'Success!',
        `Your credit claim for $${estimatedCredit.toFixed(2)} has been submitted successfully!`,
        [
          {
            text: 'Submit Another',
            onPress: () => {
              setFormData({
                assistanceType: 'assistance',
                productCategory: '',
                customerType: 'new',
                saleValue: '',
                timeOfSale: new Date(),
                description: '',
                additionalNotes: '',
              });
            },
          },
          { text: 'Done', style: 'default' },
        ]
      );

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to submit credit claim. Please try again.';
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderDateTimePicker = () => (
    <>
      <View style={styles.dateTimeContainer}>
        <Text style={styles.label}>Time of Sale</Text>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="event" size={20} color="#666" />
          <Text style={styles.dateTimeText}>{formatDateTime(formData.timeOfSale)}</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.timeOfSale}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              handleInputChange('timeOfSale', selectedDate);
              if (Platform.OS === 'android') {
                setShowTimePicker(true);
              }
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={formData.timeOfSale}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              const newDateTime = new Date(formData.timeOfSale);
              newDateTime.setHours(selectedTime.getHours());
              newDateTime.setMinutes(selectedTime.getMinutes());
              handleInputChange('timeOfSale', newDateTime);
            }
          }}
        />
      )}
    </>
  );

  const estimatedCredit = calculateEstimatedCredit();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="assignment" size={32} color="#8B5A83" />
        <Text style={styles.title}>Manual Credit Submission</Text>
        <Text style={styles.subtitle}>Fill out the details of your sales assistance</Text>
      </View>

      <View style={styles.form}>
        {/* Assistance Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Type of Assistance</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.assistanceType}
              style={styles.picker}
              onValueChange={(value) => handleInputChange('assistanceType', value)}
            >
              {assistanceTypes.map(type => (
                <Picker.Item key={type.value} label={type.label} value={type.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Product Category */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Product Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.productCategory}
              style={styles.picker}
              onValueChange={(value) => handleInputChange('productCategory', value)}
            >
              <Picker.Item label="Select a category..." value="" />
              {productCategories.map(category => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Customer Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Customer Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.customerType}
              style={styles.picker}
              onValueChange={(value) => handleInputChange('customerType', value)}
            >
              {customerTypes.map(type => (
                <Picker.Item key={type.value} label={type.label} value={type.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Sale Value */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Approximate Sale Value ($)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.saleValue}
            onChangeText={(value) => handleInputChange('saleValue', value)}
            placeholder="Enter sale amount (e.g., 45.00)"
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
        </View>

        {/* Date/Time Picker */}
        {renderDateTimePicker()}

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description of Assistance</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Describe how you helped the customer (e.g., 'Recommended rose quartz for self-love and explained its properties')"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.additionalNotes}
            onChangeText={(value) => handleInputChange('additionalNotes', value)}
            placeholder="Any additional context or details..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Credit Preview */}
        {estimatedCredit > 0 && (
          <View style={styles.creditPreview}>
            <Text style={styles.creditPreviewTitle}>Estimated Credit</Text>
            <Text style={styles.creditPreviewAmount}>${estimatedCredit.toFixed(2)}</Text>
            <Text style={styles.creditPreviewNote}>
              Based on {assistanceTypes.find(t => t.value === formData.assistanceType)?.label}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Credit Claim'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          All submissions are reviewed for accuracy. Credits will be approved within 24 hours.
        </Text>
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
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  dateTimeContainer: {
    marginBottom: 20,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  creditPreview: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  creditPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  creditPreviewAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  creditPreviewNote: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#8B5A83',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ManualCreditSubmissionScreen;