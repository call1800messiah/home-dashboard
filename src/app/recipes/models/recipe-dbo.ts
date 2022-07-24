import firebase from 'firebase/compat/app';
import FieldValue = firebase.firestore.FieldValue;

export interface RecipeDbo {
  ingredients: Record<string, number | FieldValue>;
  ingredientUnits: Record<string, string | FieldValue>;
  instructions: string;
  name: string;
  summary: string;
  time: number;
}
