// Ollama AI Service — talks to a local Ollama instance for LLM features
// Falls back to fast, delightful templates when Ollama is unavailable

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

// Timeout helper so local fetch doesn't hang if Ollama is not active
async function fetchWithTimeout(url: string, options: any, timeoutMs = 1200): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function queryOllama(prompt: string, systemPrompt?: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        system: systemPrompt || '',
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          num_predict: 256,
        }
      })
    }, 1500);

    if (!response.ok) return null;
    const data = await response.json() as OllamaResponse;
    return data.response;
  } catch {
    return null;
  }
}

// Extract JSON from LLM response (handles markdown code blocks)
function extractJson(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];

  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch) return bracketMatch[0];

  return text.trim();
}

// ============================
// SORTING CEREMONY
// ============================

export interface SortingQuestionData {
  question: string;
  options: string[];
}

// Short, cute, funny, lovely questions to get students excited!
export const FALLBACK_QUESTIONS: Array<{
  question: string;
  options: string[];
  houseMapping: Record<number, 'Gryffindor' | 'Hufflepuff' | 'Ravenclaw' | 'Slytherin'>;
}> = [
  {
    question: "You arrive at the Hogwarts Express! What magical treat do you grab first from the trolley? 🍬",
    options: [
      "Chocolate Frog — catch it before it hops out the window! 🐸",
      "Warm Pumpkin Pasty to share with your new cabin-mate 🥧",
      "Bertie Bott's Every Flavour Beans — cataloging every rare flavor! 📜",
      "Cauldron Cake with the secret hidden glitter icing 🪄"
    ],
    houseMapping: {
      0: 'Gryffindor',
      1: 'Hufflepuff',
      2: 'Ravenclaw',
      3: 'Slytherin'
    }
  },
  {
    question: "Your pet companion is having a mischievous morning! Who is your magical buddy? 🐾",
    options: [
      "A brave ginger cat who chases enchanted boggarts 🦁",
      "A cuddly chubby pygmy puff that naps in your scarf 🧶",
      "A clever snowy owl that organizes your parchment rolls 🦉",
      "A sleek green snake that whispers witty jokes in class 🐍"
    ],
    houseMapping: {
      0: 'Gryffindor',
      1: 'Hufflepuff',
      2: 'Ravenclaw',
      3: 'Slytherin'
    }
  },
  {
    question: "Oops! You brewed a potion by accident and it turned bright purple and bubbly. What happened? 🧪",
    options: [
      "I drank a sip to see if it gives me superpowers! 💥",
      "It smells like freshly baked honey biscuits, let's share it! 🍪",
      "I immediately started noting down the exact boiling temperature 📖",
      "I bottled it as 'Mysterious Elixir' to trade for something cool 💎"
    ],
    houseMapping: {
      0: 'Gryffindor',
      1: 'Hufflepuff',
      2: 'Ravenclaw',
      3: 'Slytherin'
    }
  },
  {
    question: "The castle paintings are whispering a secret staircase password. What do you do? 🏰",
    options: [
      "Sprint right up to explore the secret rooftop tower! ⚔️",
      "Bake some cookies to thank the portrait for being friendly 🍪",
      "Decode the historical anagram hidden in the portrait frame 🧩",
      "Find out where the shortcut leads so I can arrive first to class 🥇"
    ],
    houseMapping: {
      0: 'Gryffindor',
      1: 'Hufflepuff',
      2: 'Ravenclaw',
      3: 'Slytherin'
    }
  },
  {
    question: "At the end of your first term, what will make your heart the happiest? ✨",
    options: [
      "Standing up for a friend and winning the Quidditch match! 🏆",
      "Having cozy late-night hot cocoa chats by the fireplace ☕",
      "Mastering an ancient spell nobody else could pronounce 📚",
      "Becoming the legendary top student everyone talks about! 👑"
    ],
    houseMapping: {
      0: 'Gryffindor',
      1: 'Hufflepuff',
      2: 'Ravenclaw',
      3: 'Slytherin'
    }
  }
];

export async function generateSortingQuestion(
  questionNumber: number,
  _previousQA: Array<{ question: string; answer: string }>
): Promise<SortingQuestionData> {
  const qIndex = Math.max(0, Math.min(questionNumber - 1, FALLBACK_QUESTIONS.length - 1));
  const fallback = FALLBACK_QUESTIONS[qIndex];

  // Try fast Ollama query with short timeout; if offline or slow, return crisp fallback immediately
  try {
    const prompt = `Generate question ${questionNumber} of 5 for a Hogwarts sorting ceremony.
Make it SHORT (1 sentence), funny, cute, and lovely!
Include 4 fun options.
Respond ONLY with JSON: {"question": "...", "options": ["...", "...", "...", "..."]}`;

    const res = await queryOllama(prompt);
    if (res) {
      const parsed = JSON.parse(extractJson(res));
      if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
        return {
          question: parsed.question,
          options: parsed.options
        };
      }
    }
  } catch {
    // Immediate fallback
  }

  return {
    question: fallback.question,
    options: fallback.options
  };
}

export async function determineSortingResult(
  questionsAndAnswers: Array<{ question: string; answer: string }>
): Promise<{ house: string; speech: string; traits: string[] }> {
  // Score based on chosen answers
  const scores: Record<string, number> = {
    Gryffindor: 0,
    Hufflepuff: 0,
    Ravenclaw: 0,
    Slytherin: 0
  };

  questionsAndAnswers.forEach((qa, qIdx) => {
    const qData = FALLBACK_QUESTIONS[qIdx];
    if (qData) {
      // Find matching option index
      const matchedIdx = qData.options.findIndex(opt => opt === qa.answer);
      if (matchedIdx !== -1) {
        const targetHouse = qData.houseMapping[matchedIdx];
        if (targetHouse) {
          scores[targetHouse] += 5;
        }
      } else {
        // Fallback keyword scanning if dynamic LLM text was used
        const ans = (qa.answer || '').toLowerCase();
        if (ans.includes('frog') || ans.includes('brave') || ans.includes('superpower') || ans.includes('sprint') || ans.includes('quidditch') || ans.includes('adventure')) {
          scores.Gryffindor += 4;
        } else if (ans.includes('warm') || ans.includes('cuddly') || ans.includes('biscuit') || ans.includes('cookie') || ans.includes('cocoa') || ans.includes('friend')) {
          scores.Hufflepuff += 4;
        } else if (ans.includes('rare') || ans.includes('clever') || ans.includes('boiling') || ans.includes('decode') || ans.includes('spell') || ans.includes('book')) {
          scores.Ravenclaw += 4;
        } else {
          scores.Slytherin += 4;
        }
      }
    }
  });

  // Sort houses by score descending
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  let house = sorted[0][0];

  // If there's an exact tie across all, pick based on the first answer
  if (sorted[0][1] === sorted[1][1] && sorted[0][1] === 0) {
    house = 'Gryffindor';
  }

  const speeches: Record<string, string> = {
    Gryffindor: "A fiery spark of daring, bold and bright! Ready for adventure and standing tall for what is right! GRYFFINDOR! 🦁",
    Hufflepuff: "Such warmth, boundless loyalty, and a heart sweet as pumpkin pasties! Welcome home to HUFFLEPUFF! 🦡",
    Ravenclaw: "A curious mind sparkling with wit, wonder, and endless creativity! You belong in RAVENCLAW! 🦅",
    Slytherin: "Cunning, charming, and born for legendary greatness! You will flourish in SLYTHERIN! 🐍"
  };

  const traitMap: Record<string, string[]> = {
    Gryffindor: ['Brave & Daring', 'Chivalrous', 'Adventure-Seeker'],
    Hufflepuff: ['Warm-Hearted', 'Ever-Loyal', 'Sweet & True'],
    Ravenclaw: ['Brilliant Mind', 'Curious & Creative', 'Wise'],
    Slytherin: ['Ambitious', 'Clever & Witty', 'Born Leader']
  };

  return {
    house,
    speech: speeches[house],
    traits: traitMap[house] || []
  };
}

// ============================
// SCHEDULE GENERATION
// ============================

export async function generateSchedule(
  house: string,
  interests: string[]
): Promise<Record<string, Array<{ time: string; subject: string; type: string }>>> {
  return getFallbackSchedule(house, interests);
}

function getFallbackSchedule(
  _house: string,
  _interests: string[]
): Record<string, Array<{ time: string; subject: string; type: string }>> {
  return {
    Monday: [
      { time: "9:00 AM", subject: "Potions & Sparkles", type: "class" },
      { time: "10:30 AM", subject: "Charms & Wandwork", type: "class" },
      { time: "1:00 PM", subject: "Defense Against Dark Arts", type: "class" },
      { time: "3:00 PM", subject: "Magical Study Corner", type: "study" },
      { time: "4:30 PM", subject: "Dueling & Broomstick Club", type: "club" }
    ],
    Tuesday: [
      { time: "9:00 AM", subject: "Transfiguration", type: "class" },
      { time: "10:30 AM", subject: "Herbology in the Greenhouses", type: "class" },
      { time: "1:00 PM", subject: "History of Magic", type: "class" },
      { time: "3:00 PM", subject: "Great Hall Cozy Study", type: "study" },
      { time: "4:30 PM", subject: "Butterbeer Social Hour", type: "free" }
    ],
    Wednesday: [
      { time: "9:00 AM", subject: "Charms Masterclass", type: "class" },
      { time: "10:30 AM", subject: "Advanced Potions", type: "class" },
      { time: "1:00 PM", subject: "Care of Magical Creatures", type: "class" },
      { time: "3:00 PM", subject: "Spell Practice Circle", type: "study" },
      { time: "4:30 PM", subject: "Quidditch Flight Practice", type: "club" }
    ],
    Thursday: [
      { time: "9:00 AM", subject: "Defense Against Dark Arts", type: "class" },
      { time: "10:30 AM", subject: "Transfiguration Secrets", type: "class" },
      { time: "1:00 PM", subject: "Arithmancy & Number Magic", type: "class" },
      { time: "3:00 PM", subject: "Enchanted Courtyard Break", type: "free" },
      { time: "4:30 PM", subject: "Stargazing & Astronomy Club", type: "club" }
    ],
    Friday: [
      { time: "9:00 AM", subject: "Herbology & Mandrake Care", type: "class" },
      { time: "10:30 AM", subject: "Magical Lore & Legends", type: "class" },
      { time: "1:00 PM", subject: "Library Archive Exploration", type: "study" },
      { time: "3:00 PM", subject: "House Unity Gathering", type: "club" },
      { time: "11:00 PM", subject: "Midnight Astronomy at Astronomy Tower", type: "class" }
    ]
  };
}

export async function styleLetter(body: string): Promise<string> {
  try {
    const prompt = `Rewrite this letter in a whimsical, magical Harry Potter style. Keep the core message but add magical flair, wizard terminology, and a charming tone. Keep it roughly the same length.
Original letter: "${body}"
Respond with ONLY the rewritten text, no commentary.`;
    const res = await queryOllama(prompt);
    if (res) return res.trim();
  } catch {
    // fallback
  }
  return `By the flutter of owl wings, I send this dispatch: "${body}" May your wand stay true! ⚡`;
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, {}, 800);
    return res.ok;
  } catch {
    return false;
  }
}
