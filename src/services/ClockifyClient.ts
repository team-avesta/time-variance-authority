import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import moment from 'moment-timezone';

interface QueueItem {
  config: AxiosRequestConfig;
  resolve: (_value: AxiosResponse) => void;
  reject: (_reason: Error) => void;
}

interface Workspace {
  id: string;
  name: string;
  [key: string]: any;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

interface TimeEntry {
  id: string;
  description: string;
  timeInterval: {
    start: string;
    end: string;
  };
  project?: {
    name: string;
  };
  task?: {
    name: string;
  };
  [key: string]: any;
}

export class ClockifyClient {
  private apiKey: string;
  private baseURL: string;
  private requestQueue: QueueItem[];
  private isProcessing: boolean;
  private rateLimitDelay: number;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.clockify.me/api/v1';
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 50; // 50ms delay between requests (20 requests per second to be safe)
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    console.log('Processing queue...');

    while (this.requestQueue.length > 0) {
      const { config, resolve, reject } = this.requestQueue.shift()!;
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, this.rateLimitDelay)
        );
        const response = await this._makeRequest(config);
        resolve(response);
      } catch (error: any) {
        if (error.response?.status === 429) {
          // Rate limit hit
          console.log('Rate limit hit, waiting before retry...');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          this.requestQueue.push({ config, resolve, reject });
        } else {
          reject(error);
        }
      }
    }

    this.isProcessing = false;
  }

  private async _makeRequest(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    return axios({
      ...config,
      headers: {
        'X-Api-Key': this.apiKey,
        ...config.headers,
      },
    });
  }

  private enqueueRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ config, resolve, reject });
      this.processQueue();
    });
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const response = await this.enqueueRequest({
      method: 'GET',
      url: `${this.baseURL}/workspaces`,
    });
    return response.data;
  }

  async getUserInfo(): Promise<UserInfo> {
    const response = await this.enqueueRequest({
      method: 'GET',
      url: `${this.baseURL}/user`,
    });
    return response.data;
  }

  async getTimeEntries(
    workspaceId: string,
    userId: string,
    startDate: moment.Moment,
    endDate: moment.Moment
  ): Promise<TimeEntry[]> {
    console.log(
      `Fetching entries for ${userId} from ${startDate.format()} to ${endDate.format()}`
    );

    // Add detailed debug logging
    console.log('DEBUG - API Request Details:', {
      userId,
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
      startLocal: startDate.format(),
      endLocal: endDate.format(),
      startUTC: startDate.utc().format(),
      endUTC: endDate.utc().format(),
      timezone: startDate.tz(),
    });

    const entries: TimeEntry[] = [];
    let page = 1;
    const pageSize = 50;

    while (true) {
      const requestParams = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        page: page,
        'page-size': pageSize,
      };

      // Log the exact API request for debugging
      console.log('DEBUG - Making Clockify API request:', {
        url: `${this.baseURL}/workspaces/${workspaceId}/user/${userId}/time-entries`,
        params: requestParams,
      });

      const response = await this.enqueueRequest({
        method: 'GET',
        url: `${this.baseURL}/workspaces/${workspaceId}/user/${userId}/time-entries`,
        params: requestParams,
      });

      // Log the response status and data length
      console.log('DEBUG - API Response:', {
        status: response.status,
        entriesCount: response.data.length,
      });

      const pageEntries = response.data;
      entries.push(...pageEntries);

      if (pageEntries.length < pageSize) break;
      page++;
    }

    console.log(`Found ${entries.length} entries for user ${userId}`);
    return entries;
  }
}
