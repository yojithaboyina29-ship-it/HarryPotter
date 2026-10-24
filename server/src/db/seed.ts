import { getDb } from './connection';

export function seedHouses(): void {
  const db = getDb();

  const houses = [
    {
      name: 'Gryffindor',
      traits: 'Bravery, Courage, Determination, Chivalry, Nerve',
      colors: '#740001,#D3A625',
      motto: 'Where dwell the brave at heart'
    },
    {
      name: 'Hufflepuff',
      traits: 'Hard Work, Patience, Loyalty, Fair Play, Kindness',
      colors: '#ECB939,#372E29',
      motto: 'Where they are just and loyal'
    },
    {
      name: 'Ravenclaw',
      traits: 'Intelligence, Wit, Wisdom, Creativity, Learning',
      colors: '#0E1A40,#946B2D',
      motto: 'Where those of wit and learning will always find their kind'
    },
    {
      name: 'Slytherin',
      traits: 'Ambition, Cunning, Leadership, Resourcefulness, Determination',
      colors: '#1A472A,#5D5D5D',
      motto: 'Where the ambitious come to thrive'
    }
  ];

  for (const house of houses) {
    db.run(
      `INSERT OR IGNORE INTO houses (name, traits, colors, motto) VALUES (?, ?, ?, ?)`,
      [house.name, house.traits, house.colors, house.motto]
    );
  }
}
