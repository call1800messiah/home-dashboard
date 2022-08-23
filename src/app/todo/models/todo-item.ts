export interface TodoItem {
  id: string;
  author: string;
  assigned?: string;
  content: string;
  created: Date;
  done: boolean;
  markedDone?: Date;
}
