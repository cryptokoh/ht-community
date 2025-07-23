import React from 'react';
import { View, Text, TouchableOpacity, Alert, Button } from 'react-native';

export default function MinimalTouchTest() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Minimal Touch Test</Text>
      
      {/* Test 1: Basic Button */}
      <Button 
        title="Native Button - Press Me"
        onPress={() => Alert.alert('Success!', 'Native button works!')}
      />
      
      {/* Test 2: TouchableOpacity with inline styles */}
      <TouchableOpacity
        onPress={() => Alert.alert('Success!', 'TouchableOpacity works!')}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          marginTop: 20,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>TouchableOpacity - Press Me</Text>
      </TouchableOpacity>
      
      {/* Test 3: Pressable area with visual feedback */}
      <View
        style={{
          backgroundColor: '#4CAF50',
          padding: 15,
          marginTop: 20,
          borderRadius: 5,
        }}
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => Alert.alert('Success!', 'View responder works!')}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>View with Responder - Press Me</Text>
      </View>
    </View>
  );
}