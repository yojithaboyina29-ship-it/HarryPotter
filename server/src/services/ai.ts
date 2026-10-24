// Ollama AI Service — talks to a local Ollama instance for LLM features
// Falls back to templates when Ollama is unavailable

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

async function queryOllama(prompt: string, systemPrompt?: string): Promise<string | null> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
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
          num_predict: 1024,
        }
      })
    });

    if (!response.ok) return null;
    const data = await response.json() as OllamaResponse;
    return data.response;
  } catch {
    console.warn('[AI] Ollama unavailable, falling back to templates');
    return null;
  }
}

// Extract JSON from LLM response (handles markdown code blocks)
function extractJson(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();

  // Try to find raw JSON
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];

  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch) return bracketMatch[0];

  return text.trim();
}

// ============================
// SORTING CEREMONY
// ============================

const HOUSE_TRAITS = {
  Gryffindor: 'Bravery, Courage, Determination, Chivalry, Nerve',
  Hufflepuff: 'Hard Work, Patience, Loyalty, Fair Play, Kindness',
  Ravenclaw: 'Intelligence, Wit, Wisdom, Creativity, Learning',
  Slytherin: 'Ambition, Cunning, Leadership, Resourcefulness, Determination'
};

const SORTING_SYSTEM_PROMPT = `You are the Sorting Hat at Hogwarts School of Witchcraft and Wizardry. You speak in a wise, slightly mysterious voice with occasional rhymes. Your job is to ask probing questions that reveal a person's true nature. Each question should explore different aspects of character: courage, intellect, loyalty, ambition, creativity, moral choices.

House traits:
- Gryffindor: ${HOUSE_TRAITS.Gryffindor}
- Hufflepuff: ${HOUSE_TRAITS.Hufflepuff}
- Ravenclaw: ${HOUSE_TRAITS.Ravenclaw}
- Slytherin: ${HOUSE_TRAITS.Slytherin}

You must respond ONLY with valid JSON. No other text.`;

export async function generateSortingQuestion(
  questionNumber: number,
  previousQA: Array<{ question: string; answer: string }>
): Promise<{ question: string; options: string[] }> {
  const qaHistory = previousQA.map((qa, i) =>
    `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`
  ).join('\n');

  const prompt = `This is question ${questionNumber} of 5 in the sorting ceremony.
${qaHistory ? `Previous questions and answers:\n${qaHistory}\n\n` : ''}
Generate the next sorting question that explores a DIFFERENT aspect of character than previous questions. The question should be scenario-based and reveal personality traits.

Respond with exactly this JSON format:
{
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"]
}`;

  const response = await queryOllama(prompt, SORTING_SYSTEM_PROMPT);

  if (response) {
    try {
      const parsed = JSON.parse(extractJson(response));
      if (parsed.question && Array.isArray(parsed.options) && parsed.options.length >= 2) {
        return { question: parsed.question, options: parsed.options.slice(0, 4) };
      }
    } catch {
      console.warn('[AI] Failed to parse sorting question, using fallback');
    }
  }

  return getFallbackQuestion(questionNumber);
}

export async function determineSortingResult(
  questionsAndAnswers: Array<{ question: string; answer: string }>
): Promise<{ house: string; speech: string; traits: string[] }> {
  const qaHistory = questionsAndAnswers.map((qa, i) =>
    `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`
  ).join('\n');

  const prompt = `Based on these sorting ceremony answers, determine which Hogwarts house this person belongs to.

${qaHistory}

Analyze each answer for traits matching each house. Respond with ONLY this JSON:
{
  "house": "HouseName",
  "speech": "A 2-3 sentence dramatic speech as the Sorting Hat announcing the house, in character",
  "traits": ["trait1", "trait2", "trait3"]
}`;

  const response = await queryOllama(prompt, SORTING_SYSTEM_PROMPT);

  if (response) {
    try {
      const parsed = JSON.parse(extractJson(response));
      const validHouses = ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'];
      if (parsed.house && validHouses.includes(parsed.house) && parsed.speech) {
        return {
          house: parsed.house,
          speech: parsed.speech,
          traits: Array.isArray(parsed.traits) ? parsed.traits : []
        };
      }
    } catch {
      console.warn('[AI] Failed to parse sorting result, using fallback scoring');
    }
  }

  return fallbackSortingResult(questionsAndAnswers);
}

// ============================
// SCHEDULE GENERATION
// ============================

export async function generateSchedule(
  house: string,
  interests: string[]
): Promise<Record<string, Array<{ time: string; subject: string; type: string }>>> {
  const prompt = `Create a weekly Hogwarts class schedule for a ${house} student interested in: ${interests.join(', ')}.

Include magical classes (Potions, Charms, Transfiguration, Defense Against the Dark Arts, Herbology, History of Magic, Astronomy, etc.), study periods, and club activities based on their interests.

Respond with ONLY this JSON format (days as keys, arrays of sessions as values):
{
  "Monday": [{"time": "9:00 AM", "subject": "Potions", "type": "class"}],
  "Tuesday": [...],
  "Wednesday": [...],
  "Thursday": [...],
  "Friday": [...]
}

Each day should have 4-6 sessions. Types: "class", "study", "club", "free"`;

  const response = await queryOllama(prompt);

  if (response) {
    try {
      const parsed = JSON.parse(extractJson(response));
      if (parsed.Monday && Array.isArray(parsed.Monday)) {
        return parsed;
      }
    } catch {
      console.warn('[AI] Failed to parse schedule, using fallback');
    }
  }

  return getFallbackSchedule(house, interests);
}

// ============================
// OWL POST - MAGICAL LETTER STYLING
// ============================

export async function styleLetter(body: string): Promise<string> {
  const prompt = `Rewrite this letter in a whimsical, magical Harry Potter style. Keep the core message but add magical flair, wizard terminology, and a charming tone. Keep it roughly the same length.

Original letter:
"${body}"

Respond with ONLY the rewritten letter text, no JSON, no quotes, no explanation.`;

  const response = await queryOllama(prompt);
  return response || body;
}

// ============================
// FALLBACK TEMPLATES
// ============================

const FALLBACK_QUESTIONS: Array<{ question: string; options: string[]; weights: Record<string, number[]> }> = [
  {
    question: "You find a mysterious, glowing artifact in a forbidden corridor. What do you do?",
    options: [
      "Pick it up immediately — adventure awaits!",
      "Study it carefully from a safe distance first",
      "Report it to a professor to keep everyone safe",
      "Consider its potential value and how to use it strategically"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  },
  {
    question: "A friend is being bullied by someone more powerful than you. How do you respond?",
    options: [
      "Stand up to the bully directly, no matter the risk",
      "Devise a clever plan to outsmart the bully",
      "Rally other friends to support and protect them together",
      "Find leverage or information to make the bully back down"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  },
  {
    question: "If you could master one magical ability, which would you choose?",
    options: [
      "The power to protect others from any danger",
      "The ability to uncover all hidden knowledge",
      "A gift for healing and nurturing all living things",
      "The skill to influence and inspire others to follow your lead"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  },
  {
    question: "You discover your best friend has been secretly breaking an important rule. What do you do?",
    options: [
      "Confront them directly and honestly about it",
      "Research the rule to understand why it exists before deciding",
      "Talk to them privately and try to understand their reasons",
      "Assess the situation — is the rule worth following, or is your friend right?"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  },
  {
    question: "What would you most like to be remembered for?",
    options: [
      "Acts of great bravery in the face of impossible odds",
      "Brilliant discoveries that changed how people think",
      "Being someone everyone could count on, through thick and thin",
      "Achieving greatness and leaving a lasting legacy"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  },
  {
    question: "You're lost in an enchanted forest at night. What guides you forward?",
    options: [
      "Your gut instinct — charge ahead with confidence",
      "Logic and observation — study the stars and surroundings",
      "Trust in the forest itself — nature will show the way",
      "Resourcefulness — use every tool at your disposal"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  },
  {
    question: "A powerful magical creature blocks your path. It can be befriended or defeated. Your approach?",
    options: [
      "Face it bravely — you won't back down from a challenge",
      "Recall everything you've read about this creature's weaknesses",
      "Approach gently and try to earn its trust with patience",
      "Negotiate — find what it wants and strike a deal"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  },
  {
    question: "Which potion would you brew first if given unlimited ingredients?",
    options: [
      "Felix Felicis — liquid luck for daring adventures",
      "A potion of infinite knowledge and perfect memory",
      "A healing elixir to cure any ailment",
      "Polyjuice Potion — the power to become anyone"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  },
  {
    question: "You've been chosen to lead a group on a dangerous quest. What's your priority?",
    options: [
      "Leading from the front and inspiring courage in others",
      "Planning the route meticulously and preparing for every scenario",
      "Making sure everyone is included, heard, and taken care of",
      "Delegating roles strategically to maximize everyone's strengths"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  },
  {
    question: "What draws you to magic most?",
    options: [
      "The thrill of the impossible becoming possible",
      "Unraveling the deep mysteries of how it works",
      "Its power to help, heal, and bring people together",
      "The doors it opens and the heights it lets you reach"
    ],
    weights: { Gryffindor: [3, 0, 0, 0], Ravenclaw: [0, 3, 0, 0], Hufflepuff: [0, 0, 3, 0], Slytherin: [0, 0, 0, 3] }
  }
];

function getFallbackQuestion(questionNumber: number): { question: string; options: string[] } {
  const q = FALLBACK_QUESTIONS[questionNumber - 1] || FALLBACK_QUESTIONS[0];
  return { question: q.question, options: q.options };
}

function fallbackSortingResult(
  questionsAndAnswers: Array<{ question: string; answer: string }>
): { house: string; speech: string; traits: string[] } {
  const scores: Record<string, number> = {
    Gryffindor: 0,
    Hufflepuff: 0,
    Ravenclaw: 0,
    Slytherin: 0
  };

  questionsAndAnswers.forEach((qa, i) => {
    const fallbackQ = FALLBACK_QUESTIONS[i];
    if (!fallbackQ) return;
    const optionIndex = fallbackQ.options.indexOf(qa.answer);
    if (optionIndex === -1) return;

    for (const house of Object.keys(scores)) {
      scores[house] += fallbackQ.weights[house][optionIndex];
    }
  });

  const sortedHouses = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const house = sortedHouses[0][0];

  const speeches: Record<string, string> = {
    Gryffindor: "Ah, I see a fire burning bright within you — courage that won't be tamed! Your heart beats with the daring spirit of those who face the unknown head-on. GRYFFINDOR!",
    Hufflepuff: "What a steadfast soul you are! Your loyalty runs deep as roots, and your kindness is a light in the darkest of times. You belong in HUFFLEPUFF!",
    Ravenclaw: "A mind as sharp as a well-forged wand! Your thirst for knowledge and love of wisdom set you apart. Welcome to RAVENCLAW!",
    Slytherin: "I see greatness in you — ambition that reaches for the stars and the cunning to grasp them. You'll do well in SLYTHERIN!"
  };

  const traitMap: Record<string, string[]> = {
    Gryffindor: ['brave', 'daring', 'chivalrous'],
    Hufflepuff: ['loyal', 'kind', 'patient'],
    Ravenclaw: ['intelligent', 'wise', 'creative'],
    Slytherin: ['ambitious', 'cunning', 'resourceful']
  };

  return {
    house,
    speech: speeches[house],
    traits: traitMap[house]
  };
}

function getFallbackSchedule(
  house: string,
  interests: string[]
): Record<string, Array<{ time: string; subject: string; type: string }>> {
  const baseSchedule: Record<string, Array<{ time: string; subject: string; type: string }>> = {
    Monday: [
      { time: "9:00 AM", subject: "Potions", type: "class" },
      { time: "10:30 AM", subject: "Charms", type: "class" },
      { time: "1:00 PM", subject: "Defense Against the Dark Arts", type: "class" },
      { time: "3:00 PM", subject: "Study Period", type: "study" },
      { time: "4:30 PM", subject: "Dueling Club", type: "club" }
    ],
    Tuesday: [
      { time: "9:00 AM", subject: "Transfiguration", type: "class" },
      { time: "10:30 AM", subject: "Herbology", type: "class" },
      { time: "1:00 PM", subject: "History of Magic", type: "class" },
      { time: "3:00 PM", subject: "Library Research", type: "study" },
      { time: "4:30 PM", subject: "Free Period", type: "free" }
    ],
    Wednesday: [
      { time: "9:00 AM", subject: "Charms", type: "class" },
      { time: "10:30 AM", subject: "Potions", type: "class" },
      { time: "1:00 PM", subject: "Care of Magical Creatures", type: "class" },
      { time: "3:00 PM", subject: "Study Group", type: "study" },
      { time: "4:30 PM", subject: "Quidditch Practice", type: "club" }
    ],
    Thursday: [
      { time: "9:00 AM", subject: "Defense Against the Dark Arts", type: "class" },
      { time: "10:30 AM", subject: "Transfiguration", type: "class" },
      { time: "1:00 PM", subject: "Arithmancy", type: "class" },
      { time: "3:00 PM", subject: "Free Period", type: "free" },
      { time: "4:30 PM", subject: "Astronomy Club", type: "club" }
    ],
    Friday: [
      { time: "9:00 AM", subject: "Herbology", type: "class" },
      { time: "10:30 AM", subject: "History of Magic", type: "class" },
      { time: "1:00 PM", subject: "Study Period", type: "study" },
      { time: "3:00 PM", subject: "House Meeting", type: "club" },
      { time: "11:30 PM", subject: "Astronomy", type: "class" }
    ]
  };

  return baseSchedule;
}

// ============================
// OLLAMA HEALTH CHECK
// ============================

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}
