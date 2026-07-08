export interface PRStatusData {
  open: number;
  closed: number;
  merged: number;
}

export class PRService {
  private static instance: PRService;
  private cache = new Map<string, PRStatusData>();

  private constructor() {}

  public static getInstance(): PRService {
    if (!PRService.instance) {
      PRService.instance = new PRService();
    }
    return PRService.instance;
  }

  public async fetchPRStatusDistribution(username: string): Promise<PRStatusData> {
    const sanitized = username.trim().toLowerCase();

    // Simulate database/remote fetch
    const response = await fetch(`/api/github/prs?username=${sanitized}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  }

  public getCachedData(username: string): PRStatusData | undefined {
    return this.cache.get(username.trim().toLowerCase());
  }

  public setCachedData(username: string, data: PRStatusData): void {
    this.cache.set(username.trim().toLowerCase(), data);
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const prService = PRService.getInstance();
export default prService;
