import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Header,
  ListItem,
  Avatar,
  Badge,
  FAB,
  ButtonGroup,
} from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { WhiteboardService, WhiteboardRoom, CreateRoomRequest } from '../../services/WhiteboardService';
import { useAppSelector } from '../../hooks/redux';

const WhiteboardLobbyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAppSelector(state => state.auth);

  const [openBoards, setOpenBoards] = useState<WhiteboardRoom[]>([]);
  const [myRooms, setMyRooms] = useState<WhiteboardRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inviteCode, setInviteCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create room form state
  const [newRoom, setNewRoom] = useState<CreateRoomRequest>({
    name: '',
    description: '',
    roomType: 'OPEN_BOARD',
    isPublic: true,
    maxParticipants: undefined,
  });

  const tabs = ['Open Boards', 'My Rooms'];

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [openBoardsData, myRoomsData] = await Promise.all([
        WhiteboardService.getOpenBoards(),
        WhiteboardService.getUserRooms(),
      ]);
      
      setOpenBoards(openBoardsData);
      setMyRooms(myRoomsData);
    } catch (error) {
      console.error('Error loading whiteboard data:', error);
      Alert.alert('Error', 'Failed to load whiteboards');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string, isOpenBoard: boolean = true) => {
    try {
      if (isOpenBoard) {
        await WhiteboardService.joinOpenBoard(roomId);
      }
      navigation.navigate('Whiteboard' as never, { roomId } as never);
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join whiteboard');
    }
  };

  const joinByInviteCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    const parsedCode = WhiteboardService.parseInviteCode(inviteCode.trim());
    if (!parsedCode || !WhiteboardService.isValidInviteCode(parsedCode)) {
      Alert.alert('Error', 'Invalid invite code format');
      return;
    }

    try {
      setShowJoinModal(false);
      setInviteCode('');
      navigation.navigate('Whiteboard' as never, { inviteCode: parsedCode } as never);
    } catch (error) {
      console.error('Error joining by invite:', error);
      Alert.alert('Error', 'Failed to join whiteboard');
    }
  };

  const createRoom = async () => {
    if (!newRoom.name.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    try {
      const room = await WhiteboardService.createRoom(newRoom);
      setShowCreateModal(false);
      setNewRoom({
        name: '',
        description: '',
        roomType: 'OPEN_BOARD',
        isPublic: true,
        maxParticipants: undefined,
      });
      
      // Navigate to the new room
      navigation.navigate('Whiteboard' as never, { roomId: room.id } as never);
      
      // Refresh data
      loadData();
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create whiteboard room');
    }
  };

  const renderRoomCard = (room: WhiteboardRoom, isOpenBoard: boolean = true) => (
    <Card key={room.id} containerStyle={styles.roomCard}>
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          {room.description && (
            <Text style={styles.roomDescription}>{room.description}</Text>
          )}
          <View style={styles.roomMeta}>
            <Badge 
              value={room.roomType.replace('_', ' ')} 
              badgeStyle={[
                styles.roomTypeBadge,
                { backgroundColor: room.roomType === 'OPEN_BOARD' ? '#4CAF50' : '#FF9800' }
              ]}
              textStyle={styles.roomTypeBadgeText}
            />
            <Text style={styles.participantCount}>
              {room._count?.participants || 0} online
            </Text>
          </View>
        </View>
        
        <Avatar
          rounded
          source={room.creator.profileImageUrl ? { uri: room.creator.profileImageUrl } : undefined}
          title={`${room.creator.firstName[0]}${room.creator.lastName[0]}`}
          size="medium"
          containerStyle={styles.creatorAvatar}
        />
      </View>

      <View style={styles.roomActions}>
        <Button
          title="Join Board"
          buttonStyle={styles.joinButton}
          titleStyle={styles.joinButtonText}
          onPress={() => joinRoom(room.id, isOpenBoard)}
          icon={<Icon name="edit" size={16} color="#fff" style={{ marginRight: 5 }} />}
        />
        
        {room.inviteCode && (
          <Button
            title="Share"
            type="outline"
            buttonStyle={styles.shareButton}
            titleStyle={styles.shareButtonText}
            onPress={() => {
              Alert.alert(
                'Invite Code',
                `Share this code: ${room.inviteCode}`,
                [
                  { text: 'Cancel' },
                  {
                    text: 'Copy Code',
                    onPress: () => {
                      // In a real app, you'd use Clipboard API here
                      Alert.alert('Copied', 'Invite code copied to clipboard');
                    }
                  }
                ]
              );
            }}
            icon={<Icon name="share" size={16} color="#8B5A83" />}
          />
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        centerComponent={{
          text: 'Whiteboard Lounge',
          style: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
        }}
        backgroundColor="#8B5A83"
        rightComponent={{
          icon: 'add',
          color: '#fff',
          onPress: () => setShowJoinModal(true),
        }}
      />

      <ButtonGroup
        onPress={setSelectedIndex}
        selectedIndex={selectedIndex}
        buttons={tabs}
        containerStyle={styles.tabContainer}
        selectedButtonStyle={styles.selectedTab}
        selectedTextStyle={styles.selectedTabText}
        textStyle={styles.tabText}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {selectedIndex === 0 ? (
          // Open Boards Tab
          <View>
            {openBoards.length > 0 ? (
              openBoards.map(room => renderRoomCard(room, true))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="dashboard" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>No open boards available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create a new board or join one with an invite code
                </Text>
              </View>
            )}
          </View>
        ) : (
          // My Rooms Tab
          <View>
            {myRooms.length > 0 ? (
              myRooms.map(room => renderRoomCard(room, false))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="create" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>No rooms yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create your first whiteboard room
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Room FAB */}
      <FAB
        style={styles.fab}
        icon={{ name: 'add', color: 'white' }}
        color="#8B5A83"
        onPress={() => setShowCreateModal(true)}
      />

      {/* Join by Invite Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            centerComponent={{
              text: 'Join Whiteboard',
              style: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
            }}
            backgroundColor="#8B5A83"
            leftComponent={{
              icon: 'close',
              color: '#fff',
              onPress: () => {
                setShowJoinModal(false);
                setInviteCode('');
              }
            }}
          />
          
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Invite Code</Text>
            <TextInput
              style={styles.inviteCodeInput}
              placeholder="6-digit invite code"
              value={inviteCode}
              onChangeText={setInviteCode}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
            <Button
              title="Join Whiteboard"
              buttonStyle={styles.modalButton}
              onPress={joinByInviteCode}
              disabled={!inviteCode.trim()}
            />
          </View>
        </View>
      </Modal>

      {/* Create Room Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Header
            centerComponent={{
              text: 'Create Whiteboard',
              style: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
            }}
            backgroundColor="#8B5A83"
            leftComponent={{
              icon: 'close',
              color: '#fff',
              onPress: () => {
                setShowCreateModal(false);
                setNewRoom({
                  name: '',
                  description: '',
                  roomType: 'OPEN_BOARD',
                  isPublic: true,
                  maxParticipants: undefined,
                });
              }
            }}
          />
          
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Room name"
              value={newRoom.name}
              onChangeText={(name) => setNewRoom({ ...newRoom, name })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={newRoom.description}
              onChangeText={(description) => setNewRoom({ ...newRoom, description })}
              multiline
            />

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Room Type</Text>
              <ButtonGroup
                onPress={(index) => {
                  const types: CreateRoomRequest['roomType'][] = ['OPEN_BOARD', 'INVITE_ROOM'];
                  setNewRoom({ ...newRoom, roomType: types[index] });
                }}
                selectedIndex={newRoom.roomType === 'OPEN_BOARD' ? 0 : 1}
                buttons={['Open Board', 'Private Room']}
                containerStyle={styles.roomTypeButtons}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Public</Text>
              <Switch
                value={newRoom.isPublic}
                onValueChange={(isPublic) => setNewRoom({ ...newRoom, isPublic })}
                trackColor={{ false: '#767577', true: '#8B5A83' }}
              />
            </View>

            <Button
              title="Create Room"
              buttonStyle={styles.modalButton}
              onPress={createRoom}
              disabled={!newRoom.name.trim()}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    height: 50,
    marginHorizontal: 0,
  },
  selectedTab: {
    backgroundColor: '#8B5A83',
  },
  selectedTabText: {
    color: '#fff',
  },
  tabText: {
    color: '#8B5A83',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  roomCard: {
    marginBottom: 10,
    borderRadius: 10,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomInfo: {
    flex: 1,
    paddingRight: 10,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  roomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomTypeBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  roomTypeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  participantCount: {
    marginLeft: 10,
    fontSize: 12,
    color: '#666',
  },
  creatorAvatar: {
    marginTop: 5,
  },
  roomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  joinButton: {
    backgroundColor: '#8B5A83',
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  shareButton: {
    borderColor: '#8B5A83',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  shareButtonText: {
    color: '#8B5A83',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inviteCodeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  roomTypeButtons: {
    height: 40,
    width: 200,
  },
  modalButton: {
    backgroundColor: '#8B5A83',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 20,
  },
});

export default WhiteboardLobbyScreen;