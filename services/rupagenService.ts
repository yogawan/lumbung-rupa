import {
  ChatTitle,
  CreateTitleResponse,
  GetTitlesResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetHistoryResponse,
  GenerateImageRequest,
  GenerateImageResponse,
} from '@/types/rupagen';

const API_BASE_URL = 'https://rupagen-llm-service.vercel.app/api/dino/llm';

/**
 * Get authorization token from storage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Create headers with authorization
 */
function getHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Create a new chat title
 */
export async function createChatTitle(): Promise<ChatTitle> {
  const response = await fetch(`${API_BASE_URL}/title`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to create chat title: ${response.statusText}`);
  }

  const result: CreateTitleResponse = await response.json();
  return result.data;
}

/**
 * Get all chat titles (history)
 */
export async function getChatTitles(
  page: number = 1,
  limit: number = 10
): Promise<GetTitlesResponse> {
  const response = await fetch(`${API_BASE_URL}/title?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get chat titles: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Send a message to AI and get response
 */
export async function sendMessage(
  titleId: string,
  content: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/history/${titleId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get chat history for a specific title
 */
export async function getChatHistory(titleId: string): Promise<GetHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/history/${titleId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get chat history: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Parse assistant response content (removes JSON wrapper if present)
 */
export function parseAssistantContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return parsed.reply || content;
  } catch {
    return content;
  }
}

/**
 * Generate image from text prompt
 */
export async function generateImage(prompt: string): Promise<GenerateImageResponse> {
  const response = await fetch('https://overcontentiously-recordless-chun.ngrok-free.dev/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate image: ${response.statusText}`);
  }

  return await response.json();
}
