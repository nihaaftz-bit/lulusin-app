import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import type { AiChatMessage, AiChatMode, SafeThesisContext } from '../types/ai';
import {
  buildSystemInstructionForMode,
  formatPromptWithHistory,
} from './aiLogic';

const GEMINI_TEXT_MODEL = 'gemini-3.8-flash';

function resolveGeminiApiKey(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || ''
      : '';
  return fromVite.trim();
}

export function isGeminiConfigured(): boolean {
  return Boolean(resolveGeminiApiKey());
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  let lastDetail = '';
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const text = (response.text ?? '').trim();
      if (!text) {
        throw new Error('GEMINI_EMPTY_RESPONSE');
      }
      return text;
    } catch (err: unknown) {
      lastDetail = err instanceof Error ? err.message : String(err);
      const isTemporaryBusy =
        lastDetail.includes('503') ||
        lastDetail.includes('UNAVAILABLE') ||
        lastDetail.includes('high demand');

      if (!isTemporaryBusy || attempt === 4) {
        break;
      }
      await wait(attempt * 1500);
    }
  }

  throw new Error(`GEMINI_DETAIL: ${lastDetail}`);
}
