// Ollama AI Service — talks to a local Ollama instance for LLM features
// Falls back to fast, delightful, randomized templates when Ollama is unavailable

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

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
          temperature: 0.85,
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

function extractJson(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return jsonMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch) return bracketMatch[0];
  return text.trim();
}

export interface SortingQuestionData {
  question: string;
  options: string[];
}

export interface QuestionBankItem {
  id: string;
  question: string;
  options: string[];
  houseMapping: Record<number, 'Gryffindor' | 'Hufflepuff' | 'Ravenclaw' | 'Slytherin'>;
}

// Rich, diverse pool of cute, funny, engaging questions
export const QUESTION_POOL: QuestionBankItem[] = [
  {
    id: "express_treat",
    question: "You arrive at the Hogwarts Express! What magical treat do you grab first from the trolley? 🍬",
    options: [
      "Chocolate Frog — catch it before it hops out the window! 🐸",
      "Warm Pumpkin Pasty to share with your new cabin-mate 🥧",
      "Bertie Bott's Every Flavour Beans — cataloging every rare flavor! 📜",
      "Cauldron Cake with the secret hidden glitter icing 🪄"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "pet_buddy",
    question: "Your pet companion is having a mischievous morning! Who is your magical buddy? 🐾",
    options: [
      "A brave ginger cat who chases enchanted boggarts 🦁",
      "A cuddly chubby pygmy puff that naps in your scarf 🧶",
      "A clever snowy owl that organizes your parchment rolls 🦉",
      "A sleek green snake that whispers witty jokes in class 🐍"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "potion_accident",
    question: "Oops! You brewed a potion by accident and it turned bright purple and bubbly. What happened? 🧪",
    options: [
      "I drank a sip to see if it gives me superpowers! 💥",
      "It smells like freshly baked honey biscuits, let's share it! 🍪",
      "I immediately started noting down the exact boiling temperature 📖",
      "I bottled it as 'Mysterious Elixir' to trade for something cool 💎"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "staircase_secret",
    question: "The castle paintings are whispering a secret staircase password. What do you do? 🏰",
    options: [
      "Sprint right up to explore the secret rooftop tower! ⚔️",
      "Bake some cookies to thank the portrait for being friendly 🍪",
      "Decode the historical anagram hidden in the portrait frame 🧩",
      "Find out where the shortcut leads so I can arrive first to class 🥇"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "term_joy",
    question: "At the end of your first term, what will make your heart the happiest? ✨",
    options: [
      "Standing up for a friend and winning the Quidditch match! 🏆",
      "Having cozy late-night hot cocoa chats by the fireplace ☕",
      "Mastering an ancient spell nobody else could pronounce 📚",
      "Becoming the legendary top student everyone talks about! 👑"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "wand_core",
    question: "Ollivander holds out your destiny wand! What mysterious core vibrates inside it? 🪄",
    options: [
      "Fiery Phoenix Feather — crackling with daring bravery! 🔥",
      "Gentle Unicorn Hair — pure, sweet, and forever faithful 🦄",
      "Ancient Sphinx Whisker — humming with riddles and secrets 🌀",
      "Polished Basilisk Fang — pulsing with royal ambition 👑"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "library_night",
    question: "You sneak into the Hogwarts library after midnight. What book calls your name? 🕯️",
    options: [
      "'Tales of Danger & Defeating Dark Dragons' 🐉",
      "'The Cozy Spellbook: Comfort Charms & Herbal Teas' 🫖",
      "'Secrets of Time-Turners & Quantum Transfiguration' ⏳",
      "'How to Win Influence & Rule Magical Societies' 📜"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "enchanted_door",
    question: "You find a locked wooden door humming with magic. How do you open it? 🚪",
    options: [
      "Kick it open with a roar of 'ALOHOMORA!' 💥",
      "Knock politely and ask if anyone inside needs a cup of tea ☕",
      "Inspect the brass keyhole to solve the mechanical rune puzzle 🔍",
      "Slip a silver hairpin in with a sly smirk and turn the tumblers 🗝️"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "mirror_desire",
    question: "You gaze into the enchanted Mirror of Erised. What reflection smiles back at you? 🪞",
    options: [
      "Me leading an adventurous rescue team across enchanted mountains 🏔️",
      "Surrounded by all my best friends laughing around a huge feast 🥧",
      "Holding an ancient library of books I wrote about the universe 🌌",
      "Wearing emerald velvet robes with the Order of Merlin First Class 🎖️"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "quidditch_role",
    question: "It's game day on the Hogwarts Quidditch pitch! Where do you shine? 🧹",
    options: [
      "Chaser diving at top speed through the golden goal hoops! 🎯",
      "Keeper cheering everyone up and protecting the team goalposts! 🛡️",
      "Strategist analyzing wind velocity and the opponent's flight paths 📐",
      "Seeker catching the Golden Snitch at the very final second for the win! 💫"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "herbology_plant",
    question: "Professor Sprout asks you to care for a strange new singing plant! What do you do? 🌱",
    options: [
      "Give it a little high-five and dare it to sing louder! 🎶",
      "Tuck it into a warm moss bed and sing a sweet lullaby 🌸",
      "Analyze the musical pitch to see what potion it can synthesize 🎼",
      "Train it to guard your dormitory door from nosy intruders 🌿"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  },
  {
    id: "boggart_laugh",
    question: "A Boggart jumps out of the wardrobe! What hilarious form does your 'Riddikulus' turn it into? 🤡",
    options: [
      "A fearsome dragon in bright pink roller skates trying not to slip! 🛼",
      "A grumpy giant monster that just wants a hug and a cookie 🍪",
      "A loud screaming encyclopedia that vomits confetti when opened 🎊",
      "A scary villain forced to dance tap in sparkly clown shoes! 👞"
    ],
    houseMapping: { 0: 'Gryffindor', 1: 'Hufflepuff', 2: 'Ravenclaw', 3: 'Slytherin' }
  }
];

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate a randomized set of 5 questions specifically for a new session
export function pickRandomQuestionSet(): QuestionBankItem[] {
  const shuffled = shuffleArray(QUESTION_POOL);
  return shuffled.slice(0, 5);
}

export async function generateSortingQuestion(
  questionNumber: number,
  _previousQA: Array<{ question: string; answer: string }>,
  sessionQuestionList?: QuestionBankItem[]
): Promise<SortingQuestionData> {
  // If session has its own assigned randomized pool, use it
  if (sessionQuestionList && sessionQuestionList.length >= questionNumber) {
    const item = sessionQuestionList[questionNumber - 1];
    return {
      question: item.question,
      options: item.options
    };
  }

  // Fallback if not passed: pick an unused question based on questionNumber or random offset
  const qIndex = (questionNumber - 1) % QUESTION_POOL.length;
  const fallback = QUESTION_POOL[qIndex];

  return {
    question: fallback.question,
    options: fallback.options
  };
}

export async function determineSortingResult(
  questionsAndAnswers: Array<{ question: string; answer: string }>
): Promise<{ house: string; speech: string; traits: string[] }> {
  const scores: Record<string, number> = {
    Gryffindor: 0,
    Hufflepuff: 0,
    Ravenclaw: 0,
    Slytherin: 0
  };

  questionsAndAnswers.forEach((qa) => {
    // Look up question in our complete pool
    const matchedQ = QUESTION_POOL.find(q => q.question === qa.question);
    if (matchedQ) {
      const optIdx = matchedQ.options.findIndex(opt => opt === qa.answer);
      if (optIdx !== -1) {
        const targetHouse = matchedQ.houseMapping[optIdx];
        if (targetHouse) {
          scores[targetHouse] += 5;
        }
      }
    } else {
      // Dynamic fallback
      const ans = (qa.answer || '').toLowerCase();
      if (ans.includes('brave') || ans.includes('quidditch') || ans.includes('dragon') || ans.includes('superpower') || ans.includes('sprint') || ans.includes('phoenix') || ans.includes('kick')) {
        scores.Gryffindor += 4;
      } else if (ans.includes('cuddly') || ans.includes('cookie') || ans.includes('warm') || ans.includes('tea') || ans.includes('unicorn') || ans.includes('friends') || ans.includes('hug')) {
        scores.Hufflepuff += 4;
      } else if (ans.includes('clever') || ans.includes('decode') || ans.includes('book') || ans.includes('spell') || ans.includes('ancient') || ans.includes('owl') || ans.includes('analyze')) {
        scores.Ravenclaw += 4;
      } else {
        scores.Slytherin += 4;
      }
    }
  });

  // Sort houses by score descending
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  let house = sorted[0][0];

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

export async function generateSchedule(
  house: string,
  interests: string[]
): Promise<Record<string, Array<{ time: string; subject: string; type: string }>>> {
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
