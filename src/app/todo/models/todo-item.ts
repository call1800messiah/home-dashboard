export interface TodoItem {
  id: string;
  author: string;
  content: string;
  created: Date;
  done: boolean;
  markedDone?: Date;
}
