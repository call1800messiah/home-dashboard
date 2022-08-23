import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TodoList } from '../models/todo-list';
import { ApiService } from '../../core/services/api.service';
import { DataService } from '../../core/services/data.service';
import { TodoItem } from '../models/todo-item';



@Injectable({
  providedIn: 'root'
})
export class TodoService {
  static readonly collection = 'todo';
  private todoLists$!: BehaviorSubject<TodoList[]>

  constructor(
    private api: ApiService,
    private data: DataService,
  ) { }

  getListById(id: string): Observable<TodoList|undefined> {
    return this.getTodoLists().pipe(
      map((lists) => lists.find(list => list.id === id))
    );
  }

  getTodoLists(): Observable<TodoList[]> {
    if (!this.todoLists$) {
      this.todoLists$ = new BehaviorSubject<TodoList[]>([]);
      this.api.getDataFromCollection(TodoService.collection).pipe(
        map(TodoService.deserializeTodoLists)
      ).subscribe((lists: TodoList[]) => {
        this.todoLists$.next(lists);
      })
    }

    return this.todoLists$.asObservable();
  }

  storeTodoItem(item: Omit<TodoItem, 'id'>, id?: string): Promise<boolean> {
    // TODO: Decide how to store todo items
    return new Promise<boolean>((resolve) => resolve(true));
  }

  storeTodoList(list: Omit<TodoList, 'id'>, id?: string): Promise<boolean> {
    return this.data.store(TodoService.serializeTodoList(list), TodoService.collection, id);
  }

  private static deserializeTodoLists(lists: any): TodoList[] {
    return lists.reduce((all: any, list: any) => {
      const todoList: TodoList = {
        ...list
      };
      all.push(todoList);
      return all;
    }, []);
  }

  private static serializeTodoList(list: Omit<TodoList, 'id'>): unknown {
    return list;
  }
}
