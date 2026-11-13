import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, of } from 'rxjs';

import { SendItemsComponent } from './send-items.component';
import { SEND_FAILED_MESSAGE, SEND_OFFLINE_MESSAGE } from '../../../shared/utils/send-messages';
import { SendSummaryComponent } from '../../../shared/components/send-summary/send-summary.component';
import { TargetListPickerComponent } from '../../../shared/components/target-list-picker/target-list-picker.component';
import { TodoModule } from '../../todo.module';
import { TodoService } from '../../services/todo.service';
import { testModule } from '../../../testing/test-module';
import type { SendSummary } from '../../../shared/utils/send-items';
import type { TodoItem } from '../../models/todo-item';
import type { TodoList } from '../../models/todo-list';

const STORAGE_KEY = 'todo-send-target-src';

function item(id: string, done: boolean): TodoItem {
  return { id, author: 'a', content: id, created: new Date(0), done, edited: new Date(0), editedBy: 'a' };
}

function list(id: string, name: string, items: TodoItem[] = []): TodoList {
  return { id, name, items, author: 'a', created: new Date(0), edited: new Date(0), editedBy: 'a', keepDone: false };
}

describe('SendItemsComponent', () => {
  let fixture: ComponentFixture<SendItemsComponent>;
  let component: SendItemsComponent;
  let todoService: { getTodoLists: () => unknown; sendOpenItems: jasmine.Spy };
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const source = list('src', 'Wöchentlich', [item('s1', false)]);
  const summary: SendSummary = { closeMatches: [], reopened: [], quantityIncreased: [], quantityChanged: [], added: ['s1'], alreadyOpen: [] };

  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);
    todoService = {
      getTodoLists: () => of([source, list('shopping', 'Einkaufsliste'), list('drogerie', 'Drogerie')]),
      sendOpenItems: jasmine.createSpy('sendOpenItems'),
    };
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    const module = testModule(TodoModule);
    await TestBed.configureTestingModule({
      ...module,
      providers: [
        ...module.providers!,
        { provide: TodoService, useValue: todoService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SendItemsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('list', source);
    fixture.componentRef.setInput('userID', 'u1');
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  const render = () => {
    fixture.componentRef.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  };
  const sendButton = (): HTMLButtonElement => fixture.nativeElement.querySelector('button.send-button');

  it('offers the other lists only', async () => {
    render();
    expect((await firstValueFrom(component.targets$)).map((target) => target.id)).toEqual(['shopping', 'drogerie']);
  });

  it('remembers the target per source list', () => {
    render();
    fixture.debugElement.query(By.directive(TargetListPickerComponent)).componentInstance.select('shopping');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('shopping');
    expect(component.targetId).toBe('shopping');
  });

  it('disables Senden without a target', () => {
    render();
    expect(sendButton().disabled).toBeTrue();
    component.targetId = 'shopping';
    render();
    expect(sendButton().disabled).toBeFalse();
  });

  it('disables Senden while the user is unknown', () => {
    fixture.componentRef.setInput('userID', undefined);
    render();
    component.targetId = 'shopping';
    render();
    expect(sendButton().disabled).toBeTrue();
  });

  it('shows "Keine offenen Einträge" when nothing is open', async () => {
    fixture.componentRef.setInput('list', list('src', 'Wöchentlich', [item('s1', true)]));
    render();
    component.targetId = 'shopping';
    await component.send();
    expect(snackBar.open).toHaveBeenCalledWith('Keine offenen Einträge', undefined, jasmine.anything());
    expect(todoService.sendOpenItems).not.toHaveBeenCalled();
  });

  it('sends and opens the summary', async () => {
    render();
    component.targetId = 'shopping';
    todoService.sendOpenItems.and.resolveTo(summary);
    await component.send();
    expect(todoService.sendOpenItems).toHaveBeenCalledOnceWith('src', 'shopping', 'u1');
    expect(dialog.open).toHaveBeenCalledWith(SendSummaryComponent, jasmine.objectContaining({
      data: { targetName: 'Einkaufsliste', summary },
    }));
  });

  it('ignores a second tap while sending', () => {
    render();
    component.targetId = 'shopping';
    todoService.sendOpenItems.and.returnValue(new Promise(() => undefined));
    component.send();
    component.send();
    expect(todoService.sendOpenItems).toHaveBeenCalledTimes(1);
  });

  it('does not try to send while offline and explains why', async () => {
    render();
    component.targetId = 'shopping';
    spyOnProperty(navigator, 'onLine').and.returnValue(false);
    await component.send();
    expect(todoService.sendOpenItems).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(SEND_OFFLINE_MESSAGE, undefined, jasmine.anything());
  });

  it('explains when the connection drops during the send', async () => {
    render();
    component.targetId = 'shopping';
    todoService.sendOpenItems.and.rejectWith(Object.assign(new Error('client is offline'), { code: 'unavailable' }));
    await component.send();
    expect(snackBar.open).toHaveBeenCalledWith(SEND_OFFLINE_MESSAGE, undefined, jasmine.anything());
    expect(component.sending).toBeFalse();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('shows "Senden fehlgeschlagen" on failure', async () => {
    render();
    component.targetId = 'shopping';
    todoService.sendOpenItems.and.rejectWith(new Error('offline'));
    await component.send();
    expect(snackBar.open).toHaveBeenCalledWith(SEND_FAILED_MESSAGE, undefined, jasmine.anything());
    expect(dialog.open).not.toHaveBeenCalled();
  });
});
