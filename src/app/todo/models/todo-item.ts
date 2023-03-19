export interface TodoItem {
  id: string;
  author: string;
  assigned?: string;
  content: string;
  created: Date;
  done: boolean;
  doneBy?: string;
  edited: Date;
  editedBy: string;
  markedDone?: Date;
}
