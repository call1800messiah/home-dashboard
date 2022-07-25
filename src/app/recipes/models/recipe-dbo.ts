import firebase from 'firebase/compat/app';
import FieldValue = firebase.firestore.FieldValue;

export interface RecipeDbo {
  author?: string;
  created?: Date;
  edited: Date;
  editedBy: string;
  ingredients: Record<string, number | FieldValue>;
  ingredientUnits: Record<string, string | FieldValue>;
  instructions: string;
  name: string;
  summary: string;
  time: number;
}
