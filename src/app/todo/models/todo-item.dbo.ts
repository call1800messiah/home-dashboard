import type { FieldValue } from '@angular/fire/firestore';

export interface TodoItemDbo {
  author: string;
  assigned?: string;
  content: string;
  created: Date;
  done: boolean;
  doneBy?: string | FieldValue;
  edited: Date;
  editedBy: string;
  markedDone?: Date | FieldValue;
}
