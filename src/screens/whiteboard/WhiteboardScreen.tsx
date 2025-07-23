import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Header, Button, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { WhiteboardService } from '../../services/WhiteboardService';
import { useAppSelector } from '../../hooks/redux';

interface RouteParams {
  roomId?: string;
  inviteCode?: string;
}

const WhiteboardScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);
  
  const { roomId, inviteCode } = (route.params as RouteParams) || {};
  const { user } = useAppSelector(state => state.auth);
  
  const [room, setRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  useEffect(() => {
    loadRoomData();
  }, [roomId, inviteCode]);

  const loadRoomData = async () => {
    try {
      setLoading(true);
      
      let currentRoomId = roomId;
      
      // If joining by invite code, join the room first
      if (inviteCode && !roomId) {
        const joinResponse = await WhiteboardService.joinRoomByInvite(inviteCode);
        currentRoomId = joinResponse.roomId;
      }
      
      if (currentRoomId) {
        const roomData = await WhiteboardService.getRoomDetails(currentRoomId);
        setRoom(roomData);
        setParticipants(roomData.participants || []);
      }
    } catch (error) {
      console.error('Error loading room data:', error);
      Alert.alert('Error', 'Failed to load whiteboard room');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const shareInviteCode = async () => {
    if (room?.inviteCode) {
      try {
        await Share.share({
          message: `Join my whiteboard session in The Healing Temple app! Use invite code: ${room.inviteCode}`,
          title: 'Whiteboard Invite',
        });
      } catch (error) {
        console.error('Error sharing invite:', error);
      }
    }
  };

  const leaveRoom = async () => {
    Alert.alert(
      'Leave Whiteboard',
      'Are you sure you want to leave this whiteboard session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              if (room?.id) {
                await WhiteboardService.leaveRoom(room.id);
              }
              navigation.goBack();
            } catch (error) {
              console.error('Error leaving room:', error);
            }
          },
        },
      ]
    );
  };

  // HTML content for tldraw WebView
  const getWebViewHTML = () => {
    const roomData = room?.tldrawData ? JSON.stringify(room.tldrawData) : 'null';
    const userId = user?.id || 'anonymous';
    const userName = `${user?.firstName} ${user?.lastName}` || 'Anonymous User';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Healing Temple Whiteboard</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            overflow: hidden;
            background: #fafafa;
        }
        .tldraw-container { 
            width: 100vw; 
            height: 100vh; 
            position: relative;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #8B5A83;
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">
            <div>Loading Whiteboard...</div>
        </div>
    </div>
    
    <!-- tldraw SDK -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/tldraw@latest/dist/tldraw.umd.js"></script>
    
    <script>
        const { Tldraw, useEditor } = tldraw;
        const { useState, useEffect, useCallback } = React;
        
        // Auto-save component
        function AutoSave({ roomId }) {
            const editor = useEditor();
            const [lastSaved, setLastSaved] = useState(Date.now());
            
            const saveData = useCallback(async () => {
                if (!editor) return;
                
                try {
                    const snapshot = editor.getSnapshot();
                    
                    // Send to React Native
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'SAVE_DATA',
                            data: snapshot,
                            roomId: roomId
                        }));
                    }
                    
                    setLastSaved(Date.now());
                } catch (error) {
                    console.error('Save failed:', error);
                }
            }, [editor, roomId]);
            
            useEffect(() => {
                if (!editor) return;
                
                // Save every 5 seconds when there are changes
                const interval = setInterval(() => {
                    if (Date.now() - lastSaved > 4000) {
                        saveData();
                    }
                }, 5000);
                
                // Save on editor changes (debounced)
                let timeout;
                const handleChange = () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(saveData, 2000);
                };
                
                editor.on('change', handleChange);
                
                return () => {
                    clearInterval(interval);
                    clearTimeout(timeout);
                    editor.off('change', handleChange);
                };
            }, [editor, saveData, lastSaved]);
            
            return null;
        }
        
        function WhiteboardApp() {
            const [snapshot, setSnapshot] = useState(${roomData});
            
            const handleMount = useCallback((editor) => {
                // Load initial data
                if (snapshot) {
                    editor.loadSnapshot(snapshot);
                }
                
                // Notify React Native that we're ready
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'WEBVIEW_READY'
                    }));
                }
            }, [snapshot]);
            
            return React.createElement('div', { className: 'tldraw-container' }, 
                React.createElement(Tldraw, {
                    onMount: handleMount,
                    persistenceKey: '${room?.id || 'temp'}',
                    autoFocus: false,
                    children: React.createElement(AutoSave, { roomId: '${room?.id || ''}' })
                })
            );
        }
        
        // Render the app
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(WhiteboardApp));
        
        // Handle messages from React Native
        document.addEventListener('message', function(e) {
            try {
                const message = JSON.parse(e.data);
                if (message.type === 'LOAD_DATA' && message.data) {
                    // Update whiteboard data
                    setSnapshot(message.data);
                }
            } catch (error) {
                console.error('Message handling error:', error);
            }
        });
    </script>
</body>
</html>`;
  };

  const onWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'WEBVIEW_READY':
          setWebViewLoaded(true);
          break;
          
        case 'SAVE_DATA':
          if (room?.id && message.data) {
            await WhiteboardService.saveWhiteboardData(room.id, message.data);
          }
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          centerComponent={{ text: 'Whiteboard', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
          backgroundColor="#8B5A83"
          leftComponent={{
            icon: 'arrow-back',
            color: '#fff',
            onPress: () => navigation.goBack(),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5A83" />
          <Text style={styles.loadingText}>Loading whiteboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        centerComponent={{ 
          text: room?.name || 'Whiteboard', 
          style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } 
        }}
        backgroundColor="#8B5A83"
        leftComponent={{
          icon: 'arrow-back',
          color: '#fff',
          onPress: leaveRoom,
        }}
        rightComponent={
          <View style={styles.headerActions}>
            {room?.inviteCode && (
              <Button
                icon={<Icon name="share" size={20} color="#fff" />}
                buttonStyle={styles.shareButton}
                onPress={shareInviteCode}
              />
            )}
            <Text style={styles.participantCount}>
              {participants.length} online
            </Text>
          </View>
        }
      />
      
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: getWebViewHTML() }}
          style={styles.webView}
          onMessage={onWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          scalesPageToFit={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEnabled={false}
          onLoadEnd={() => setWebViewLoaded(true)}
        />
        
        {!webViewLoaded && (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color="#8B5A83" />
            <Text style={styles.loadingText}>Preparing whiteboard...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8B5A83',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: 'transparent',
    padding: 5,
  },
  participantCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
});

export default WhiteboardScreen;