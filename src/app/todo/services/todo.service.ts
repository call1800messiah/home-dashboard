import { Injectable } from '@angular/core';
import { deleteField } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import type { TodoItem } from '../models/todo-item';
import type { TodoItemDbo } from '../models/todo-item.dbo';
import type { TodoList } from '../models/todo-list';
import type { TodoListDbo } from '../models/todo-list.dbo';
import { ApiService } from '../../core/services/api.service';
import { DataService } from '../../core/services/data.service';
import { UtilService } from '../../core/services/util.service';



@Injectable({
  providedIn: 'root'
})
export class TodoService {
  static readonly collectionItems = 'todoItems';
  static readonly collectionLists = 'todo';
  private todoItems$!: BehaviorSubject<TodoItem[]>;
  private todoLists$!: BehaviorSubject<TodoList[]>;

  constructor(
    private api: ApiService,
    private data: DataService,
  ) { }

  async deleteTodoItem(itemId: string, listId: string): Promise<void> {
    await this.deleteTodoItemFromList(itemId, listId);
    await this.api.deleteDocumentFromCollection(itemId, TodoService.collectionItems);
  }

  deleteTodoList(id: string): Promise<void> {
    return this.api.deleteDocumentFromCollection(id, TodoService.collectionLists);
  }

  getListById(id: string): Observable<TodoList|undefined> {
    return this.getTodoLists().pipe(
      map((lists) => lists.find(list => list.id === id))
    );
  }

  getTodoLists(): Observable<TodoList[]> {
    if (!this.todoLists$) {
      this.todoLists$ = new BehaviorSubject<TodoList[]>([]);
      combineLatest([
        this.api.getDataFromCollection(TodoService.collectionLists),
        this.getTodoItems(),
      ]).pipe(
        map(TodoService.deserializeTodoLists),
        map((lists) => lists.sort(UtilService.orderByName)),
      ).subscribe((lists: TodoList[]) => {
        this.todoLists$.next(lists);
      });
    }

    return this.todoLists$.asObservable();
  }

  storeEditedTodoItem(item: Omit<TodoItem, 'id'>, itemId: string): Promise<boolean | string> {
    return this.data.store(this.serializeTodoItem(item, itemId), TodoService.collectionItems, itemId);
  }

  async storeNewTodoItem(item: Omit<TodoItem, 'id'>, listId: string, position: number): Promise<boolean|string> {
    const itemStored = await this.data.store(this.serializeTodoItem(item), TodoService.collectionItems);
    if (itemStored && typeof itemStored === 'string') {
      return this.addTodoItemToList({...item, id: itemStored}, listId, position);
    }
    return false;
  }

  storeTodoList(list: Omit<TodoList, 'id'>, id?: string): Promise<boolean|string> {
    return this.data.store(TodoService.serializeTodoList(list), TodoService.collectionLists, id);
  }

  private addTodoItemToList(item: TodoItem, listId: string, position: number): Promise<boolean|string> {
    return new Promise((resolve) => {
      this.getListById(listId).pipe(
        take(1),
      ).subscribe(list => {
        if (list) {
          list.items.splice(position, 0, item);
          this.storeTodoList(list, listId).then((result) => {
            resolve(result);
          });
        }

        resolve(false);
      });
    });
  }

  private deleteTodoItemFromList(itemId: string, listId: string): Promise<void> {
    return new Promise((resolve) => {
      this.getListById(listId).pipe(
        take(1),
      ).subscribe(list => {
        if (list) {
          const newList = {
            ...list,
            items: list.items.filter(item => item.id !== itemId),
          };
          // @ts-ignore
          delete newList.id;
          this.storeTodoList(newList, listId).then(() => {});
        }
        resolve();
      });
    });
  }

  private getTodoItems(): Observable<TodoItem[]> {
    if (!this.todoItems$) {
      this.todoItems$ = new BehaviorSubject<TodoItem[]>([]);
      this.api.getDataFromCollection(TodoService.collectionItems).pipe(
        map(TodoService.deserializeTodoItems),
      ).subscribe((items: TodoItem[]) => {
        this.todoItems$.next(items);
      });
    }

    return this.todoItems$;
  }

  private serializeTodoItem(item: Omit<TodoItem, 'id'>, todoID?: string): TodoItemDbo {
    if (todoID) {
      const updateItem: TodoItemDbo = {...item};
      this.todoItems$.pipe(
        take(1),
        map((items) => items.find((item) => item.id === todoID)),
      ).subscribe((currentItem) => {
        if (currentItem) {
          console.log(currentItem, updateItem);
          if (updateItem.markedDone === undefined && currentItem.markedDone !== undefined) {
            updateItem.markedDone = deleteField();
          }
          if (updateItem.doneBy === undefined && currentItem.doneBy !== undefined) {
            updateItem.doneBy = deleteField();
          }
        }
      });
      return updateItem;
    }

    return item;
  }

  private static deserializeTodoItems(items: any): TodoItem[] {
    return items.reduce((all: any, item: any) => {
      const todoItem: TodoItem = {
        ...item
      };
      all.push(todoItem);
      return all;
    }, []);
  }

  private static deserializeTodoLists([lists, items]: [any, any]): TodoList[] {
    return lists.reduce((all: any, list: any) => {
      const todoList: TodoList = {
        ...list,
        items: list.items?.map(
          (itemId: string) => items.find((item: TodoItem) => item.id === itemId)
        ) || [],
      };
      all.push(todoList);
      return all;
    }, []);
  }

  private static serializeTodoList(list: Omit<TodoList, 'id'>): TodoListDbo {
    return {
      ...list,
      items: list.items?.map((item) => item.id) || [],
    };
  }
}
