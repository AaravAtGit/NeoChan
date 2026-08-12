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
  no: number;       // same as OP's no
  board: string;
  subject: string;
  op: Post;
  replies: Post[];
  bumpedAt: number; // ms — for ordering
};

export type Board = {
  slug: string;     // 'oc', 'g', 'tech'…
  title: string;    // 'Hardware'
  description: string;
  accent: 'yellow' | 'pink' | 'red' | 'paper';
};