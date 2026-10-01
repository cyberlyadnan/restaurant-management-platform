import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { DEFAULT_WS_URL, STORAGE_KEYS } from '../config/env';

export type NetworkState = 'ONLINE' | 'CONNECTING' | 'OFFLINE';

type EventListener = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private connectionStateListeners: Set<(state: NetworkState) => void> = new Set();
  private currentState: NetworkState = 'OFFLINE';

  public async connect(branchId: string) {
    if (this.socket?.connected) {
      return;
    }

    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    const serverUrl = (await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL)) || DEFAULT_WS_URL;

    this.updateState('CONNECTING');

    this.socket = io(serverUrl, {
      query: { branchId },
      extraHeaders: {
        cookie: token ? `nodedr_session=${encodeURIComponent(token)}` : '',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.updateState('ONLINE');
    });

    this.socket.on('disconnect', () => {
      this.updateState('OFFLINE');
    });

    this.socket.on('connect_error', () => {
      this.updateState('OFFLINE');
    });

    // Re-attach registered listeners to the socket instance
    this.listeners.forEach((callbackSet, event) => {
      callbackSet.forEach((cb) => {
        this.socket?.on(event, cb);
      });
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.updateState('OFFLINE');
  }

  public on(event: string, callback: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback: EventListener) {
    this.listeners.get(event)?.delete(callback);
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  public onConnectionStateChange(callback: (state: NetworkState) => void) {
    this.connectionStateListeners.add(callback);
    callback(this.currentState);
    return () => {
      this.connectionStateListeners.delete(callback);
    };
  }

  private updateState(state: NetworkState) {
    this.currentState = state;
    this.connectionStateListeners.forEach((cb) => cb(state));
  }
}

export const socketService = new SocketService();
