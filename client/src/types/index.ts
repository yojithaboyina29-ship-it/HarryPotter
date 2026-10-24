export interface User {
  id: number;
  username: string;
  email: string;
  house_id: number | null;
  house_name?: string;
  sorting_reason?: string;
  avatar_url?: string;
}

export interface House {
  id: number;
  name: string;
  traits: string;
  colors: string;
  motto: string;
  total_points: number;
  member_count: number;
}

export interface SortingQuestion {
  question: string;
  options: string[];
  questionNumber: number;
}

export interface SortingResult {
  house: string;
  speech: string;
  traits: string[];
}

export interface ScheduleSession {
  time: string;
  subject: string;
  type: 'class' | 'study' | 'club' | 'free';
}

export interface Schedule {
  [day: string]: ScheduleSession[];
}

export interface Letter {
  id: number;
  sender_id: number;
  sender_username: string;
  recipient_id: number;
  recipient_username: string;
  subject: string;
  body: string;
  styled_body?: string;
  owl_name: string;
  is_read: boolean;
  sent_at: string;
  delivered_at: string;
}

export interface Post {
  id: number;
  author_id: number;
  author_username: string;
  house_id: number;
  house_name: string;
  title: string;
  body: string;
  upvotes: number;
  has_upvoted?: boolean;
  comment_count: number;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  author_username: string;
  house_name: string;
  body: string;
  created_at: string;
}

export interface LeaderboardHouse extends House {}

export interface LeaderboardUser {
  username: string;
  house_name: string;
  total_points: number;
}
