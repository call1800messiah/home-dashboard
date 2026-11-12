import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, of } from 'rxjs';

import { SendItemsComponent } from './send-items.component';
import { SendSummaryComponent } from '../send-summary/send-summary.component';
import { TodoModule } from '../../todo.module';
import { TodoService } from '../../services/todo.service';
import { testModule } from '../../../testing/test-module';
import type { SendSummary } from '../../services/send-items';
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
  const summary: SendSummary = { closeMatches: [], reopened: [], quantityChanged: [], added: ['s1'], alreadyOpen: [] };

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
    component.selectTarget('shopping');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('shopping');
  });

  it('preselects the remembered target', async () => {
    localStorage.setItem(STORAGE_KEY, 'shopping');
    render();
    await fixture.whenStable();
    expect(component.targetId).toBe('shopping');
  });

  it('ignores a remembered target that no longer exists', async () => {
    localStorage.setItem(STORAGE_KEY, 'deleted');
    render();
    await fixture.whenStable();
    expect(component.targetId).toBeNull();
  });

  it('disables Senden without a target', () => {
    render();
    expect(sendButton().disabled).toBeTrue();
    component.selectTarget('shopping');
    render();
    expect(sendButton().disabled).toBeFalse();
  });

  it('disables Senden while the user is unknown', () => {
    fixture.componentRef.setInput('userID', undefined);
    render();
    component.selectTarget('shopping');
    render();
    expect(sendButton().disabled).toBeTrue();
  });

  it('shows "Keine offenen Einträge" when nothing is open', async () => {
    fixture.componentRef.setInput('list', list('src', 'Wöchentlich', [item('s1', true)]));
    render();
    component.selectTarget('shopping');
    await component.send();
    expect(snackBar.open).toHaveBeenCalledWith('Keine offenen Einträge', undefined, jasmine.anything());
    expect(todoService.sendOpenItems).not.toHaveBeenCalled();
  });

  it('sends and opens the summary', async () => {
    render();
    component.selectTarget('shopping');
    todoService.sendOpenItems.and.resolveTo(summary);
    await component.send();
    expect(todoService.sendOpenItems).toHaveBeenCalledOnceWith('src', 'shopping', 'u1');
    expect(dialog.open).toHaveBeenCalledWith(SendSummaryComponent, jasmine.objectContaining({
      data: { targetName: 'Einkaufsliste', summary },
    }));
  });

  it('ignores a second tap while sending', () => {
    render();
    component.selectTarget('shopping');
    todoService.sendOpenItems.and.returnValue(new Promise(() => undefined));
    component.send();
    component.send();
    expect(todoService.sendOpenItems).toHaveBeenCalledTimes(1);
  });

  it('shows "Senden fehlgeschlagen" on failure', async () => {
    render();
    component.selectTarget('shopping');
    todoService.sendOpenItems.and.rejectWith(new Error('offline'));
    await component.send();
    expect(snackBar.open).toHaveBeenCalledWith('Senden fehlgeschlagen', undefined, jasmine.anything());
    expect(dialog.open).not.toHaveBeenCalled();
  });
});
