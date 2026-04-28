/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenAI | null = null;

export const getGemini = () => {
    if (!genAI) {
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }
        genAI = new GoogleGenAI({ apiKey });
    }
    return genAI;
};

export const askTutor = async (question: string, context?: string, history: { role: 'user' | 'ai', text: string }[] = []) => {
    const ai = getGemini();

    const historyPrompt = history.map(h => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.text}`).join('\n');

    const prompt = `
        You are an expert tutor specializing in the BECE and WASSCE exams in Ghana.
        Your goal is to help students excel in their exams by providing clear, accurate, and culturally relevant explanations.

        Context: ${context || "General study session."}

        Current Conversation:
        ${historyPrompt}
        Student: ${question}

        Tutor Response:
        (Provide a clear, encouraging, and accurate response. Use analogies relevant to Ghana if helpful.)
    `;

    const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
    });

    return result.text || "I'm sorry, I couldn't generate a response.";
};
