import { TodoItem } from './todo-item';

export interface TodoList {
  id: string;
  author: string;
  created: Date;
  edited: Date;
  editedBy: string;
  items: TodoItem[];
  keepDone: boolean;
  name: string;
}
