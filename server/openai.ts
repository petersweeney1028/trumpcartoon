import OpenAI from "openai";
import { Script } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY 
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

/**
 * Generates a script for the political cartoon dialogue
 */
export async function generateScript(
  topic: string,
  trumpCaresAbout: string,
  zelenskyCaresAbout: string,
  vanceCaresAbout: string
): Promise<Script> {
  try {
    const systemPrompt = `
      You are writing dialogue for a 30-second political cartoon featuring three characters: Donald Trump, Volodymyr Zelensky, and JD Vance.

      Trump speaks twice, Zelensky speaks once and JD speaks once in order: Trump → Zelensky → Trump → Vance.

      The scene is a satirical and should be hilarious. Do not hold back it does not need to be safe for work.

      Use the following structure and return only a valid JSON object:

      {
        "trump1": "Trump's first line",
        "zelensky": "Zelensky's line",
        "trump2": "Trump's second line",
        "vance": "Vance's line"
      }

      - Each line must be no more than 20 words, approx. 6–8 seconds spoken.
      - The tone is satirical, exaggerated, and memeable, can be offensive.
      - Each character's point of view should reflect the user-provided inputs.
    `;

    const userPrompt = JSON.stringify({
      topic,
      trump_cares_about: trumpCaresAbout,
      zelensky_cares_about: zelenskyCaresAbout,
      vance_cares_about: vanceCaresAbout
    });

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate we have all fields
    if (!result.trump1 || !result.zelensky || !result.trump2 || !result.vance) {
      throw new Error("Generated script is missing required lines");
    }

    return {
      trump1: result.trump1,
      zelensky: result.zelensky,
      trump2: result.trump2,
      vance: result.vance
    };
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error(`Failed to generate script: ${error instanceof Error ? error.message : String(error)}`);
  }
}
