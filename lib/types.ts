export type Post = {
  no: number;
  name: string;
  email?: string;
  subject?: string;
  comment: string;
  image?: { url: string; name: string; size: string; w?: number; h?: number };
  date: string; // 08/12/26(Wed)14:02:11
  sage?: boolean;
  op?: boolean;
};

export type Thread = {
  no: number;
  board: string;
  subject: string;
  op: Post;
  replies: Post[];
  bumpedAt: number;
};

export type Board = {
  slug: string;
  title: string;
  description: string;
  accent: 'yellow' | 'pink' | 'red' | 'paper';
};