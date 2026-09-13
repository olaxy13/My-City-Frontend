import {
  City,
  Category,
  ListingDetail,
  CountdownSliderItem,
  PaginatedResponse,
  CloudinarySignatureResponse,
  AdminLoginResponse,
  CreateSubmissionInput,
  CreateSubmissionPayload,
  ResubmitSubmissionPayload,
  ListingStatus,
  ListingType,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Auto attach admin token from localStorage if in browser
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('city_discovery_admin_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    let detailMsg = '';
    if (body?.error?.details && typeof body.error.details === 'object') {
      const detailsList = Object.entries(body.error.details)
        .map(([field, val]: [string, any]) => `${field.replace(/^body\./, '')}: ${val?.message || val}`)
        .join('; ');
      if (detailsList) detailMsg = `: ${detailsList}`;
    }

    const errorMsg =
      (body?.error?.message ? `${body.error.message}${detailMsg}` : null) ||
      body?.message ||
      (typeof body === 'string' ? body : `Request failed with status ${res.status}`);
    throw new ApiError(errorMsg, res.status, body);
  }

  // Automatically unpack backend standard ApiResponse & PaginatedApiResponse envelopes
  if (body && typeof body === 'object') {
    if ('pagination' in body && 'data' in body) {
      return {
        data: Array.isArray(body.data) ? body.data : [],
        pagination: body.pagination,
      } as T;
    }
    if ('data' in body && body.data !== undefined) {
      return body.data as T;
    }
  }

  return body as T;
}

export const api = {
  // --- Public Discovery APIs ---
  async getCities(): Promise<City[]> {
    return request<City[]>('/cities');
  },

  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/categories');
  },

  async getUpcomingCountdown(city?: string, limit: number = 8): Promise<CountdownSliderItem[]> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (limit) params.append('limit', limit.toString());
    return request<CountdownSliderItem[]>(`/listings/upcoming-countdown?${params.toString()}`);
  },

  async getListings(params: {
    city?: string;
    category?: string;
    type?: string;
    neighborhood?: string;
    date?: string; // 'today', 'tomorrow', 'this-weekend', 'this-week', 'this-month'
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    isFeatured?: boolean;
  } = {}): Promise<PaginatedResponse<ListingDetail>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return request<PaginatedResponse<ListingDetail>>(`/listings?${searchParams.toString()}`);
  },

  async getListingById(id: string): Promise<ListingDetail> {
    return request<ListingDetail>(`/listings/${id}`);
  },

  // --- Submissions & Cloudinary Upload ---
  async getUploadSignature(type: 'thumbnail' | 'gallery' | 'legal_doc' = 'thumbnail'): Promise<CloudinarySignatureResponse> {
    return request<CloudinarySignatureResponse>(`/media/upload-signature?type=${type}`);
  },

  async uploadToCloudinary(file: File, type: 'thumbnail' | 'gallery' | 'legal_doc' = 'thumbnail'): Promise<string> {
    const sigData = await this.getUploadSignature(type);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sigData.apiKey);
    formData.append('timestamp', sigData.timestamp.toString());
    formData.append('signature', sigData.signature);
    formData.append('folder', sigData.folder);

    const uploadRes = await fetch(sigData.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to upload media file to Cloudinary');
    }

    const json = await uploadRes.json();
    return json.secure_url;
  },

  async createSubmission(payload: CreateSubmissionPayload | CreateSubmissionInput): Promise<{ id: string; editToken: string; message: string }> {
    return request<{ id: string; editToken: string; message: string }>('/submissions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getSubmissionByToken(id: string, editToken: string): Promise<ListingDetail> {
    return request<ListingDetail>(`/submissions/${id}?editToken=${encodeURIComponent(editToken)}`);
  },

  async updateSubmission(id: string, editToken: string, payload: ResubmitSubmissionPayload | Partial<CreateSubmissionInput>): Promise<{ id: string; message: string }> {
    return request<{ id: string; message: string }>(`/submissions/${id}?editToken=${encodeURIComponent(editToken)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // --- Admin Moderation & Management ---
  async adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
    return request<AdminLoginResponse>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getAdminListings(params: {
    status?: ListingStatus;
    type?: ListingType;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<ListingDetail>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return request<PaginatedResponse<ListingDetail>>(`/admin/listings?${searchParams.toString()}`);
  },

  async getAdminListingDetail(id: string): Promise<ListingDetail> {
    return request<ListingDetail>(`/admin/listings/${id}`);
  },

  async approveListing(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/admin/listings/${id}/approve`, {
      method: 'PUT',
    });
  },

  async rejectListing(id: string, rejectionReason: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/admin/listings/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectionReason }),
    });
  },

  async requestChanges(id: string, adminNotes: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/admin/listings/${id}/request-changes`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    });
  },

  async toggleFeatured(id: string, isFeatured: boolean, featuredOrder: number = 0): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/admin/listings/${id}/feature`, {
      method: 'PUT',
      body: JSON.stringify({ isFeatured, featuredOrder }),
    });
  },

  async reorderFeatured(orderedIds: string[]): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/admin/listings/reorder-featured', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
  },

  async togglePublishStatus(id: string, isPublished: boolean): Promise<{ success: boolean; isPublished: boolean }> {
    return request<{ success: boolean; isPublished: boolean }>(`/admin/listings/${id}/publish-status`, {
      method: 'PUT',
      body: JSON.stringify({ isPublished }),
    });
  },
};
