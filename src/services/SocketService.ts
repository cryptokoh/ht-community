import { io, Socket } from 'socket.io-client';

interface SocketEventHandlers {
  [event: string]: (...args: any[]) => void;
}

class SocketServiceClass {
  private socket: Socket | null = null;
  private isConnected = false;
  private eventHandlers: SocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private serverUrl = 'http://localhost:3001'; // Backend server URL

  connect(token?: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      this.socket = io(this.serverUrl, {
        auth: {
          token: token || '', // JWT token for authentication
        },
        transports: ['websocket'],
        timeout: 10000,
        autoConnect: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Error connecting to socket server:', error);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't reconnect automatically
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.handleReconnection();
    });

    // Real-time message events
    this.socket.on('new_message', (data) => {
      console.log('New message received:', data);
      this.emit('message_received', data);
    });

    this.socket.on('user_joined', (data) => {
      console.log('User joined:', data);
      this.emit('user_joined', data);
    });

    this.socket.on('user_left', (data) => {
      console.log('User left:', data);
      this.emit('user_left', data);
    });

    this.socket.on('typing_start', (data) => {
      this.emit('typing_start', data);
    });

    this.socket.on('typing_stop', (data) => {
      this.emit('typing_stop', data);
    });

    // Community events
    this.socket.on('new_post', (data) => {
      console.log('New community post:', data);
      this.emit('new_post', data);
    });

    this.socket.on('post_updated', (data) => {
      this.emit('post_updated', data);
    });

    // Check-in events
    this.socket.on('user_checked_in', (data) => {
      console.log('User checked in:', data);
      this.emit('user_checked_in', data);
    });

    // Whiteboard events
    this.socket.on('whiteboard_draw', (data) => {
      this.emit('whiteboard_draw', data);
    });

    this.socket.on('whiteboard_clear', (data) => {
      this.emit('whiteboard_clear', data);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isConnected) {
          this.socket?.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers = {};
    }
  }

  // Event emission methods
  sendMessage(conversationId: string, message: string): void {
    if (!this.isConnected || !this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('send_message', {
      conversationId,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  joinConversation(conversationId: string): void {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('leave_conversation', { conversationId });
  }

  startTyping(conversationId: string): void {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('typing_stop', { conversationId });
  }

  joinWhiteboardRoom(roomId: string): void {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('join_whiteboard', { roomId });
  }

  leaveWhiteboardRoom(roomId: string): void {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('leave_whiteboard', { roomId });
  }

  sendWhiteboardDraw(roomId: string, drawData: any): void {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('whiteboard_draw', { roomId, drawData });
  }

  clearWhiteboard(roomId: string): void {
    if (!this.isConnected || !this.socket) return;
    this.socket.emit('whiteboard_clear', { roomId });
  }

  // Event listener management
  on(event: string, handler: (...args: any[]) => void): void {
    this.eventHandlers[event] = handler;
  }

  off(event: string): void {
    delete this.eventHandlers[event];
  }

  private emit(event: string, ...args: any[]): void {
    const handler = this.eventHandlers[event];
    if (handler) {
      handler(...args);
    }
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

export const SocketService = new SocketServiceClass();