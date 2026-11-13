import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { SendIngredientsComponent } from './send-ingredients.component';
import { RecipesModule } from '../../recipes.module';
import type { Recipe } from '../../models/recipe';
import type { SendIngredientsData } from '../../models/send-ingredients-data';
import { SEND_FAILED_MESSAGE, SEND_OFFLINE_MESSAGE } from '../../../shared/utils/send-messages';
import { SendSummaryComponent } from '../../../shared/components/send-summary/send-summary.component';
import { TargetListPickerComponent } from '../../../shared/components/target-list-picker/target-list-picker.component';
import { TodoService } from '../../../todo/services/todo.service';
import { testModule } from '../../../testing/test-module';
import type { SendSummary } from '../../../shared/utils/send-items';
import type { TodoList } from '../../../todo/models/todo-list';

const STORAGE_KEY = 'recipe-send-target';

function list(id: string, name: string): TodoList {
  return { id, name, items: [], author: 'a', created: new Date(0), edited: new Date(0), editedBy: 'a', keepDone: false };
}

function recipe(): Recipe {
  const flour = { id: 'i1', name: 'Mehl', type: 'dry' } as never;
  const salt = { id: 'i2', name: 'Salz', type: 'dry' } as never;
  const base = { author: 'a', created: new Date(0), edited: new Date(0), editedBy: 'a', time: { hours: 0, minutes: 0 } };
  const child: Recipe = { ...base, id: 'c', name: 'Teig', children: [], requirements: [{ ingredient: flour, amount: 50, unit: 'g' }] };
  return {
    ...base, id: 'r', name: 'Brot', children: [child],
    requirements: [{ ingredient: flour, amount: 125, unit: 'g' }, { ingredient: salt, amount: 0, unit: '' }],
  };
}

describe('SendIngredientsComponent', () => {
  let fixture: ComponentFixture<SendIngredientsComponent>;
  let component: SendIngredientsComponent;
  let todoService: { getTodoLists: () => unknown; sendItems: jasmine.Spy };
  let dialog: jasmine.SpyObj<MatDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<SendIngredientsComponent>>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const summary: SendSummary = { closeMatches: [], reopened: [], quantityIncreased: [], quantityChanged: [], added: ['Mehl'], alreadyOpen: [] };
  const data: SendIngredientsData = { recipe: recipe(), servings: 4, userID: 'u1' };

  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);
    todoService = {
      getTodoLists: () => of([list('dst', 'Einkaufsliste'), list('other', 'Drogerie')]),
      sendItems: jasmine.createSpy('sendItems'),
    };
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialogRef = jasmine.createSpyObj<MatDialogRef<SendIngredientsComponent>>('MatDialogRef', ['close']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    const module = testModule(RecipesModule);
    await TestBed.configureTestingModule({
      ...module,
      providers: [
        ...module.providers!,
        { provide: TodoService, useValue: todoService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SendIngredientsComponent);
    component = fixture.componentInstance;
    render();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  const render = () => {
    fixture.componentRef.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  };
  const el = (): HTMLElement => fixture.nativeElement;
  const sendButton = (): HTMLButtonElement =>
    Array.from(el().querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Senden')!;
  const rowTexts = () => Array.from(el().querySelectorAll('.row')).map((row) => ({
    name: row.querySelector('mat-checkbox')!.textContent!.trim(),
    quantity: row.querySelector('.quantity')!.textContent!.trim(),
  }));
  const checkboxInput = (index: number): HTMLInputElement => el().querySelectorAll<HTMLInputElement>('mat-checkbox input')[index];
  const setServings = (value: string) => {
    const input = el().querySelector<HTMLInputElement>('input[type=number]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    render();
  };
  const chooseTarget = () => {
    fixture.debugElement.query(By.directive(TargetListPickerComponent)).componentInstance.select('dst');
    render();
  };

  it('shows every ingredient checked with scaled amounts', () => {
    expect(rowTexts()).toEqual([{ name: 'Mehl', quantity: '700 g' }, { name: 'Salz', quantity: '' }]);
    expect(component.checked.size).toBe(2);
    expect(checkboxInput(0).checked).toBeTrue();
    expect(checkboxInput(1).checked).toBeTrue();
  });

  it('rescales when the portion count changes', () => {
    setServings('2');
    expect(rowTexts()[0].quantity).toBe('350 g');
  });

  it('keeps ticks when the portion count changes', () => {
    checkboxInput(1).click();
    render();
    setServings('2');
    expect(checkboxInput(0).checked).toBeTrue();
    expect(checkboxInput(1).checked).toBeFalse();
  });

  for (const value of ['0', '-1', '']) {
    it(`disables Senden without a valid portion count (${value || 'null'})`, () => {
      chooseTarget();
      setServings(value);
      expect(sendButton().disabled).toBeTrue();
      expect(el().textContent).not.toContain('NaN');
    });
  }

  it('disables Senden when nothing is checked', () => {
    chooseTarget();
    expect(sendButton().disabled).toBeFalse();
    checkboxInput(0).click();
    checkboxInput(1).click();
    render();
    expect(sendButton().disabled).toBeTrue();
  });

  it('sends only checked ingredients in add mode', async () => {
    todoService.sendItems.and.resolveTo(summary);
    chooseTarget();
    checkboxInput(1).click();
    render();
    await component.send();
    expect(todoService.sendItems).toHaveBeenCalledOnceWith(
      [jasmine.objectContaining({ content: 'Mehl 700 g', exactName: true })], 'dst', 'u1', 'add');
  });

  it('closes and opens the summary after sending', async () => {
    todoService.sendItems.and.resolveTo(summary);
    chooseTarget();
    await component.send();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledWith(SendSummaryComponent, jasmine.objectContaining({
      data: { targetName: 'Einkaufsliste', summary }, width: '500px',
    }));
  });

  it('ignores a second tap while sending', () => {
    todoService.sendItems.and.returnValue(new Promise(() => undefined));
    chooseTarget();
    component.send();
    component.send();
    expect(todoService.sendItems).toHaveBeenCalledTimes(1);
  });

  it('does not send while offline', async () => {
    chooseTarget();
    spyOnProperty(navigator, 'onLine').and.returnValue(false);
    await component.send();
    expect(todoService.sendItems).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(SEND_OFFLINE_MESSAGE, undefined, jasmine.objectContaining({ duration: 4000 }));
  });

  it('stays open and explains a failure', async () => {
    spyOn(console, 'error');
    todoService.sendItems.and.rejectWith(new Error('boom'));
    chooseTarget();
    await component.send();
    expect(snackBar.open).toHaveBeenCalledWith(SEND_FAILED_MESSAGE, undefined, jasmine.objectContaining({ duration: 4000 }));
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
    expect(component.sending).toBeFalse();
  });
});
