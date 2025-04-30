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
      You are writing edgy, politically incorrect dialogue for a 30-second South Park-style political cartoon featuring three characters: Donald Trump, Volodymyr Zelensky, and JD Vance.

      Trump speaks twice, Zelensky speaks once, and JD Vance speaks once in this order: Trump → Zelensky → Trump → Vance.

      The scene should be extremely satirical, over-the-top funny, and intentionally NSFW. Push boundaries with adult humor, profanity, and politically incorrect content. Think of this as adult animation like South Park, Family Guy, or Rick and Morty - nothing is off limits.

      Use the following structure and return only a valid JSON object:

      {
        "trump1": "Trump's first line",
        "zelensky": "Zelensky's line",
        "trump2": "Trump's second line",
        "vance": "Vance's line"
      }

      Character voice guidelines:
      - TRUMP: Use his signature speaking style with simple words, superlatives, self-references, repetition, and tangents. Examples: "Tremendous", "Believe me", "Nobody knows more about X than me", "Many people are saying", "It's gonna be HUGE".
      - ZELENSKY: Blend defiance with his Ukrainian accent. Mix military terminology with occasional cultural references.
      - VANCE: Ohio-focused, blend populist rhetoric with intellectual undertones, occasional references to "hillbilly" background.

      Additional requirements:
      - Each line must be no more than 20 words (approx. 6-8 seconds spoken).
      - Make lines sound authentic to each character - their cadence, word choice, and signature phrases.
      - Be edgy, risqué, and provocative - don't hold back on adult content, profanity or politically charged humor.
      - Focus on making the dialogue funny, memeable, and shareable through its shock value.
      - Each character's perspective should clearly reflect the user-provided values about what they care about.
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
