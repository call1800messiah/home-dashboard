export interface TodoListDbo {
  author: string;
  created: Date;
  edited: Date;
  editedBy: string;
  items: string[];
  keepDone: boolean;
  name: string;
}
