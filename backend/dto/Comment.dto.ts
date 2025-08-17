export interface comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CommentNode = {
  id: number;
  parentComment_id: number | null;
  [key: string]: any;
  children: CommentNode[];
};
