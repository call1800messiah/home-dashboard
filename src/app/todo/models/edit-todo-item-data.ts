import { TodoItem } from './todo-item';

export interface EditTodoItemData {
  item?: TodoItem;
  listId: string;
}
