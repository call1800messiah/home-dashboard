import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, Observable } from 'rxjs';

import type { IngredientRow } from '../../models/ingredient-row';
import type { SendIngredientsData } from '../../models/send-ingredients-data';
import type { SendSummaryData } from '../../../shared/models/send-summary-data';
import type { TodoList } from '../../../todo/models/todo-list';
import { buildIngredientRows, rowQuantity, rowSource } from '../../utils/ingredient-rows';
import { TodoService } from '../../../todo/services/todo.service';
import { SEND_FAILED_MESSAGE, SEND_OFFLINE_MESSAGE } from '../../../shared/utils/send-messages';
import { SendSummaryComponent } from '../../../shared/components/send-summary/send-summary.component';

const MESSAGE_DURATION = 4000;

/** Dialog to pick a recipe's ingredients and portion count and send them to a todo list. */
@Component({
    selector: 'app-send-ingredients',
    templateUrl: './send-ingredients.component.html',
    styleUrls: ['./send-ingredients.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SendIngredientsComponent {
  readonly rows: IngredientRow[];
  readonly checked: Set<string>;
  readonly targets$: Observable<TodoList[]>;
  readonly rowQuantity = rowQuantity;
  servings: number;
  targetId: string | null = null;
  sending = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: SendIngredientsData,
    private dialogRef: MatDialogRef<SendIngredientsComponent>,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private todoService: TodoService,
  ) {
    this.rows = buildIngredientRows(data.recipe);
    this.checked = new Set(this.rows.map((row) => row.key));
    this.servings = data.servings;
    this.targets$ = this.todoService.getTodoLists();
  }

  get canSend(): boolean {
    return !!this.targetId
      && Number.isInteger(this.servings) && this.servings >= 1
      && this.checked.size > 0
      && !this.sending;
  }

  toggle(row: IngredientRow, isChecked: boolean): void {
    if (isChecked) {
      this.checked.add(row.key);
    } else {
      this.checked.delete(row.key);
    }
  }

  async send(): Promise<void> {
    if (!this.canSend) {
      return;
    }
    if (!navigator.onLine) {
      this.snackBar.open(SEND_OFFLINE_MESSAGE, undefined, { duration: MESSAGE_DURATION });
      return;
    }

    const targetId = this.targetId!;
    const sources = this.rows.filter((row) => this.checked.has(row.key)).map((row) => rowSource(row, this.servings));
    this.sending = true;
    try {
      const summary = await this.todoService.sendItems(sources, targetId, this.data.userID, 'add');
      const targets = await firstValueFrom(this.targets$);
      const summaryData: SendSummaryData = { targetName: targets.find((target) => target.id === targetId)?.name ?? '', summary };
      this.dialogRef.close();
      this.dialog.open(SendSummaryComponent, { data: summaryData, width: '500px' });
    } catch (error) {
      console.error(error);
      const offline = (error as { code?: string } | null)?.code === 'unavailable';
      this.snackBar.open(offline ? SEND_OFFLINE_MESSAGE : SEND_FAILED_MESSAGE, undefined, { duration: MESSAGE_DURATION });
    } finally {
      this.sending = false;
    }
  }
}
