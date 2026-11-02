
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from server/.env");
    process.exitCode = 1;
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log("Testing Gemini API with GEMINI_API_KEY...");

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Say hello in one sentence."
    });

    console.log("Gemini API is working!");
    console.log(result.text);
  } catch (error) {
    console.error("Gemini API test failed.");
    console.error("Message:", error.message);
    console.error("Status:", error.status ?? error.statusCode ?? "Unknown");
    process.exitCode = 1;
  }
}

main();
