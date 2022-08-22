import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, switchMap } from 'rxjs';
import { TodoList } from '../../models/todo-list';
import { TodoService } from '../../services/todo.service';
import { ActivatedRoute } from '@angular/router';
import { TodoItem } from '../../models/todo-item';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  list!: TodoList;
  private listSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private todoService: TodoService,
  ) { }

  ngOnInit(): void {
    this.listSub = this.route.paramMap.pipe(
      switchMap(params => {
        return this.todoService.getListById(params.get('id') ?? '');
      }),
    ).subscribe((list) => {
      if (list) {
        this.list = list;
      }
    });
  }

  ngOnDestroy() {
    this.listSub.unsubscribe();
  }
}
