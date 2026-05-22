export type Msg = {
  id: number;
  author_id: number;
  author_name: string;
  author_avatar: string | null;
  text: string | null;
  photo_url: string | null;
  created_at: string;
  recipient_id?: number | null;
};

export type Member = {
  id: number;
  full_name: string;
  avatar_url: string | null;
  role: string;
  last_seen_at: string | null;
  unread?: number;
};

export type Me = { id: number; role: string; full_name: string };

export const isOnline = (lastSeen: string | null) => {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 90_000;
};
