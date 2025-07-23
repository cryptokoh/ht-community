import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api/v1' 
  : 'https://api.healingtemple.com/api/v1';

// Create axios instance with interceptors for auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh logic here
      // For now, just redirect to login
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
    return Promise.reject(error);
  }
);

export interface WhiteboardRoom {
  id: string;
  name: string;
  description?: string;
  roomType: 'OPEN_BOARD' | 'INVITE_ROOM' | 'MEMBER_ROOM';
  inviteCode?: string;
  isPublic: boolean;
  maxParticipants?: number;
  createdBy: string;
  isActive: boolean;
  expiresAt?: string;
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  participants?: WhiteboardParticipant[];
  _count?: {
    participants: number;
  };
}

export interface WhiteboardParticipant {
  id: string;
  roomId: string;
  userId: string;
  role: 'OWNER' | 'MODERATOR' | 'PARTICIPANT';
  joinedAt: string;
  lastActive?: string;
  leftAt?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  roomType: 'OPEN_BOARD' | 'INVITE_ROOM' | 'MEMBER_ROOM';
  isPublic?: boolean;
  maxParticipants?: number;
}

export class WhiteboardService {
  /**
   * Get all open boards available to join
   */
  static async getOpenBoards(): Promise<WhiteboardRoom[]> {
    try {
      const response = await apiClient.get('/whiteboard/open-boards');
      return response.data;
    } catch (error) {
      console.error('Error fetching open boards:', error);
      throw error;
    }
  }

  /**
   * Get user's whiteboard rooms
   */
  static async getUserRooms(): Promise<WhiteboardRoom[]> {
    try {
      const response = await apiClient.get('/whiteboard/my-rooms');
      return response.data;
    } catch (error) {
      console.error('Error fetching user rooms:', error);
      throw error;
    }
  }

  /**
   * Create a new whiteboard room
   */
  static async createRoom(roomData: CreateRoomRequest): Promise<WhiteboardRoom> {
    try {
      const response = await apiClient.post('/whiteboard/rooms', roomData);
      return response.data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  /**
   * Join a room by invite code
   */
  static async joinRoomByInvite(inviteCode: string): Promise<{ message: string; roomId: string }> {
    try {
      const response = await apiClient.post(`/whiteboard/rooms/join/${inviteCode}`);
      return response.data;
    } catch (error) {
      console.error('Error joining room by invite:', error);
      throw error;
    }
  }

  /**
   * Join an open board
   */
  static async joinOpenBoard(roomId: string): Promise<{ message: string; roomId: string }> {
    try {
      const response = await apiClient.post(`/whiteboard/rooms/${roomId}/join`);
      return response.data;
    } catch (error) {
      console.error('Error joining open board:', error);
      throw error;
    }
  }

  /**
   * Leave a room
   */
  static async leaveRoom(roomId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`/whiteboard/rooms/${roomId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  }

  /**
   * Get room details
   */
  static async getRoomDetails(roomId: string): Promise<WhiteboardRoom> {
    try {
      const response = await apiClient.get(`/whiteboard/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching room details:', error);
      throw error;
    }
  }

  /**
   * Save whiteboard data
   */
  static async saveWhiteboardData(roomId: string, tldrawData: any): Promise<{ message: string }> {
    try {
      const response = await apiClient.put(`/whiteboard/rooms/${roomId}/data`, {
        tldrawData,
      });
      return response.data;
    } catch (error) {
      console.error('Error saving whiteboard data:', error);
      throw error;
    }
  }

  /**
   * Generate a shareable room link
   */
  static generateShareableLink(inviteCode: string): string {
    return `healingtemple://whiteboard/join/${inviteCode}`;
  }

  /**
   * Parse invite code from various formats
   */
  static parseInviteCode(input: string): string | null {
    // Direct 6-digit code
    if (/^\d{6}$/.test(input)) {
      return input;
    }
    
    // From URL or link
    const match = input.match(/(?:invite[=\/]|join[=\/])(\d{6})/);
    return match ? match[1] : null;
  }

  /**
   * Validate invite code format
   */
  static isValidInviteCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  }
}

export default WhiteboardService;