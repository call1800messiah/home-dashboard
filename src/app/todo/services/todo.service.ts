import { Injectable } from '@angular/core';
import { deleteField } from '@angular/fire/firestore';
import { BehaviorSubject, combineLatest, firstValueFrom, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import type { TodoItem } from '../models/todo-item';
import type { TodoItemDbo } from '../models/todo-item.dbo';
import type { TodoList } from '../models/todo-list';
import type { TodoListDbo } from '../models/todo-list.dbo';
import { ApiService, DocumentWrite, Transaction } from '../../core/services/api.service';
import { DataService } from '../../core/services/data.service';
import { UtilService } from '../../core/services/util.service';
import { planSend, SendPlan, SendSummary } from '../../shared/utils/send-items';



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

  /**
   * Sends the open items of one list to another in a single transaction: matching items there are
   * unticked or get the new quantity, the rest are added at the top. Rejects if a list is
   * missing or the write fails, in which case nothing was changed.
   */
  async sendOpenItems(sourceListId: string, targetListId: string, userId: string): Promise<SendSummary> {
    const lists = await firstValueFrom(this.getTodoLists());
    const source = lists.find((list) => list.id === sourceListId);
    if (!source || !lists.some((list) => list.id === targetListId)) {
      throw new Error(`Todo list ${source ? targetListId : sourceListId} not found`);
    }
    // The open items as this device shows them; the target is read fresh from the server.
    const sourceItems = source.items.filter((item) => item && !item.done);

    return this.api.runTransaction(async (transaction) => {
      const target = await transaction.get(TodoService.collectionLists, targetListId);
      if (!target) {
        throw new Error(`Todo list ${targetListId} not found`);
      }
      const itemIds: string[] = target['items'] ?? [];
      const found = await Promise.all(itemIds.map(async (id) => {
        const data = await transaction.get(TodoService.collectionItems, id);
        return data ? { ...data, id } as TodoItem : undefined;
      }));
      // Items whose document was deleted are left out, and so dropped from the list.
      const targetItems = found.filter((item): item is TodoItem => item !== undefined);
      const plan = planSend(sourceItems, targetItems);
      if (plan.updates.length > 0 || plan.newItems.length > 0) {
        this.writeSend(transaction, plan, targetListId, targetItems, userId);
      }
      return plan.summary;
    });
  }

  private writeSend(transaction: Transaction, plan: SendPlan, targetListId: string, targetItems: TodoItem[], userId: string): void {

    const now = new Date();
    const updates: DocumentWrite[] =plan.updates.map(({ itemId, content, untick }) => ({
      collectionID: TodoService.collectionItems,
      documentID: itemId,
      data: {
        content,
        edited: now,
        editedBy: userId,
        ...(untick ? { done: false, doneBy: deleteField(), markedDone: deleteField() } : {}),
      },
      merge: true,
    }));
    const newItems: DocumentWrite[] =plan.newItems.map((content) => ({
      collectionID: TodoService.collectionItems,
      documentID: this.api.createId(),
      data: { author: userId, content, created: now, done: false, edited: now, editedBy: userId },
      merge: false,
    }));
    const list: DocumentWrite = {
      collectionID: TodoService.collectionLists,
      documentID: targetListId,
      data: {
        items: [...newItems.map((item) => item.documentID), ...targetItems.map((item) => item.id)],
        edited: now,
        editedBy: userId,
      },
      merge: true,
    };

    [...updates, ...newItems, list].forEach((write) => transaction.set(write));
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

  /**
   * Saves a list's name and keepDone without writing its items, so a rename can't drop items
   * another device added meanwhile.
   */
  updateTodoListSettings(id: string, settings: Pick<TodoList, 'name' | 'keepDone'>, userId: string): Promise<boolean|string> {
    const { name, keepDone } = settings;
    return this.data.store({ name, keepDone, edited: new Date(), editedBy: userId }, TodoService.collectionLists, id);
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
        } else {
          resolve(false);
        }
      });
    });
  }

  /** Removes just this id, so items another device added to the list meanwhile stay. */
  private deleteTodoItemFromList(itemId: string, listId: string): Promise<void> {
    return this.api.removeFromArray(listId, TodoService.collectionLists, 'items', itemId);
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
