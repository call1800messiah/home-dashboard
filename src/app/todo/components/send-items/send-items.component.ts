import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { TodoList } from '../../models/todo-list';
import type { SendSummaryData } from '../../models/send-summary-data';
import { TodoService } from '../../services/todo.service';
import { SendSummaryComponent } from '../send-summary/send-summary.component';

const MESSAGE_DURATION = 4000;



/** Target dropdown and "Senden" button that send a list's open items to another list. */
@Component({
    selector: 'app-send-items',
    templateUrl: './send-items.component.html',
    styleUrls: ['./send-items.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SendItemsComponent implements OnInit {
  @Input() list!: TodoList;
  @Input() userID?: string;
  targets$!: Observable<TodoList[]>;
  targetId: string | null = null;
  sending = false;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private todoService: TodoService,
  ) {}

  ngOnInit(): void {
    this.targets$ = this.todoService.getTodoLists().pipe(
      map((lists) => lists.filter((list) => list.id !== this.list.id)),
    );

    const stored = this.readStoredTarget();
    if (stored) {
      firstValueFrom(this.targets$).then((targets) => {
        if (targets.some((target) => target.id === stored)) {
          this.targetId = stored;
        }
      });
    }
  }

  selectTarget(id: string): void {
    this.targetId = id;
    try {
      localStorage.setItem(this.storageKey, id);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit only.
    }
  }

  async send(): Promise<void> {
    if (this.sending || !this.targetId || !this.userID) {
      return;
    }
    if (!this.list.items.some((item) => item && !item.done)) {
      this.snackBar.open('Keine offenen Einträge', undefined, { duration: MESSAGE_DURATION });
      return;
    }

    const targetId = this.targetId;
    this.sending = true;
    try {
      const summary = await this.todoService.sendOpenItems(this.list.id, targetId, this.userID);
      const targets = await firstValueFrom(this.targets$);
      const data: SendSummaryData = { targetName: targets.find((target) => target.id === targetId)?.name ?? '', summary };
      this.dialog.open(SendSummaryComponent, { data, width: '500px' });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Senden fehlgeschlagen', undefined, { duration: MESSAGE_DURATION });
    } finally {
      this.sending = false;
    }
  }

  private get storageKey(): string {
    return `todo-send-target-${this.list.id}`;
  }

  private readStoredTarget(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }
}
