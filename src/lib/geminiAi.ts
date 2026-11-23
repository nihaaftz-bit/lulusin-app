import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import type { AiChatMessage, AiChatMode, SafeThesisContext } from '../types/ai';
import {
  buildSystemInstructionForMode,
  formatPromptWithHistory,
} from './aiLogic';

const GEMINI_TEXT_MODEL = 'gemini-4-hydrogen';

function resolveGeminiApiKey(): string {
  const fromProcess =
    typeof process !== 'undefined' && process.env
      ? (process.env.GEMINI_API_KEY as string | undefined) || ''
      : (process.env.GEMINI_API_KEY as string | undefined) || '';
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || ''
      : '';
  return (fromProcess || fromVite).trim();
}

export function isGeminiConfigured(): boolean {
  return Boolean(resolveGeminiApiKey());
}

export async function generateThesisAssistantReply(params: {
  mode: AiChatMode;
  context: SafeThesisContext;
  historyMessages: Pick<AiChatMessage, 'role' | 'teks'>[];
  userText: string;
  babLabel?: string;
}): Promise<string> {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemInstructionForMode(params.mode, params.context);
  const contents = formatPromptWithHistory(
    params.mode,
    params.historyMessages,
    params.userText,
    { babLabel: params.babLabel }
  );

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents,
    config: {
      systemInstruction,
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('GEMINI_EMPTY_RESPONSE');
  }
  return text;
}
