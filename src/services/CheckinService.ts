import { api } from './AuthService';

export interface CheckInRequest {
  method: 'QR_CODE' | 'GEOFENCE' | 'MANUAL';
  latitude?: number;
  longitude?: number;
  qrCode?: string;
  notes?: string;
}

export interface CheckInResponse {
  checkin: {
    id: string;
    method: string;
    timestamp: string;
    locationVerified: boolean;
  };
  user: {
    name: string;
    memberTier: string;
  };
  creditBalance: number;
  message: string;
}

export interface CheckInHistoryResponse {
  checkins: Array<{
    id: string;
    checkinMethod: string;
    locationVerified: boolean;
    createdAt: string;
    notes?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CheckInAnalyticsResponse {
  period: string;
  stats: {
    totalCheckins: number;
    recentCheckins: number;
    visitStreak: number;
    averageVisitsPerWeek: number;
  };
  methodBreakdown: Record<string, number>;
  dayOfWeekBreakdown: Record<string, number>;
}

export class CheckinService {
  static async checkIn(request: CheckInRequest): Promise<CheckInResponse> {
    const response = await api.post('/checkins/checkin', request);
    return response.data;
  }

  static async getCheckInHistory(
    page: number = 1,
    limit: number = 20
  ): Promise<CheckInHistoryResponse> {
    const response = await api.get('/checkins/history', {
      params: { page, limit },
    });
    return response.data;
  }

  static async getCheckInAnalytics(days: number = 30): Promise<CheckInAnalyticsResponse> {
    const response = await api.get('/checkins/analytics', {
      params: { days },
    });
    return response.data;
  }

  static async staffCheckInUser(qrCode: string): Promise<CheckInResponse> {
    const response = await api.post(`/checkins/staff/checkin/${qrCode}`);
    return response.data;
  }
}