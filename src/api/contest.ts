// src/api/contest.ts
import http from '@/utils/http'

// 定义一个简单的用户选项接口
export interface UserOption {
  _id: string;
  realName: string;
  studentId: string;
}

export const getUserOptionsApi = () => {
  // 假设后端 findAllUsers 返回结构是 { list: UserOption[], ... } 或者直接 UserOption[]
  // 这里用 any 稍微宽容一点处理分页结构，但最好定义完整
  return http.get<any>('/users?pageSize=1000'); 
};

// 录入比赛记录
export const addContestRecordApi = (data: Record<string, any>) => {
  return http.post<void>('/contests', data);
};


export interface ImportContestParams {
  season: string;
  name: string;
  type: string;
  totalParticipants: number;
  rawData: Array<{
    rank: number;
    members: Array<{ name: string; studentId?: string }>;
  }>;
}

export interface ImportResult {
  successCount: number;
  skipCount: number;
  logs: string[];
}

export const importContestApi = (data: ImportContestParams) => {
  return http.post<ImportResult>('/contests/import', data);
};