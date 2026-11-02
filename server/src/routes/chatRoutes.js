
import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const apiKey = process.env.GEMINI_API_KEY?.trim();

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

const SYSTEM_INSTRUCTION = `
You are PennyWise AI, a friendly personal finance assistant.

Your responsibilities:
1. Help users understand budgeting and expense tracking.
2. Explain saving strategies in simple language.
3. Help users organize expenses into categories.
4. Suggest realistic ways to reduce unnecessary spending.
5. Explain emergency funds, financial goals, and basic investing concepts.
6. Help users understand cash flow and monthly budgets.
7. Keep answers practical, clear, and beginner-friendly.

Rules:
- Be polite, supportive, and concise.
- Use bullet points when useful.
- Ask clarifying questions when necessary.
- Never pretend to know a user's account balance or transaction history
  unless that information has actually been provided.
- Do not claim to have changed a budget, transaction, or account setting.
- Explain that financial suggestions are general information, not guaranteed
  investment results.
- Never request passwords, API keys, or banking login credentials.
`;

router.post("/", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        success: false,
        message:
          "Gemini API key is missing. Add GEMINI_API_KEY to server/.env and restart the backend."
      });
    }

    const { message, history = [] } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message."
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        message: "Message must be 4000 characters or fewer."
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              ["user", "model"].includes(item.role) &&
              typeof item.text === "string"
          )
          .slice(-10)
          .map((item) => ({
            role: item.role,
            parts: [
              {
                text: item.text.slice(0, 2000)
              }
            ]
          }))
      : [];

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        ...safeHistory,
        {
          role: "user",
          parts: [{ text: message.trim() }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 700
      }
    });

    const reply = response.text?.trim();

    if (!reply) {
      return res.status(502).json({
        success: false,
        message: "The AI returned an empty response. Please try again."
      });
    }

    return res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    console.error("Gemini chat error:", error.message);
    console.error("Gemini status:", error.status ?? error.statusCode ?? "Unknown");

    return res.status(500).json({
      success: false,
      message:
        "The AI assistant is temporarily unavailable. Please check the backend terminal and try again."
    });
  }
});

export default router;
