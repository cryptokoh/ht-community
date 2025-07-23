import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
  Button,
} from 'react-native';

const TestScreen = () => {
  const handlePress = (type: string) => {
    Alert.alert('Success!', `${type} pressed!`);
    console.log(`${type} pressed!`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Touch Test Screen</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => handlePress('TouchableOpacity')}
      >
        <Text style={styles.buttonText}>TouchableOpacity Button</Text>
      </TouchableOpacity>

      <Pressable 
        style={styles.button}
        onPress={() => handlePress('Pressable')}
      >
        <Text style={styles.buttonText}>Pressable Button</Text>
      </Pressable>

      <View style={styles.buttonWrapper}>
        <Button 
          title="Native Button"
          onPress={() => handlePress('Native Button')}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#4CAF50' }]}
        onPress={() => {
          console.log('Direct console log test');
          Alert.alert('Direct Alert', 'This is a direct alert call');
        }}
      >
        <Text style={styles.buttonText}>Direct Alert Test</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#8B5A83',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonWrapper: {
    marginVertical: 10,
    width: '80%',
  },
});

export default TestScreen;