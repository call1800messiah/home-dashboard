import firebase from 'firebase/compat/app';
import FieldValue = firebase.firestore.FieldValue;

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
