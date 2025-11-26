// RupaGen AI LLM API Types

export interface ChatTitle {
  _id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateTitleResponse {
  data: ChatTitle;
}

export interface GetTitlesResponse {
  data: ChatTitle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatHistory {
  _id: string;
  titleId: string;
  createdAt: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  message: string;
  data: ChatHistory;
}

export interface GetHistoryResponse {
  message: string;
  data: ChatHistory;
}

// Image Generation API Types
export interface GenerateImageRequest {
  prompt: string;
}

export interface GenerateImageResponse {
  url: string;
}
