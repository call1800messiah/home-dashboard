import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetListPickerComponent } from './target-list-picker.component';
import { SharedModule } from '../../shared.module';
import { testModule } from '../../../testing/test-module';

const KEY = 'target-list-picker-test';
const LISTS = [{ id: 'shopping', name: 'Einkaufsliste' }, { id: 'drogerie', name: 'Drogerie' }];

describe('TargetListPickerComponent', () => {
  let fixture: ComponentFixture<TargetListPickerComponent>;
  let component: TargetListPickerComponent;
  let emitted: string[];

  beforeEach(async () => {
    localStorage.removeItem(KEY);
    await TestBed.configureTestingModule(testModule(SharedModule)).compileComponents();
    fixture = TestBed.createComponent(TargetListPickerComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.targetChange.subscribe((id) => emitted.push(id));
    fixture.componentRef.setInput('storageKey', KEY);
    fixture.componentRef.setInput('label', 'Senden an');
  });

  afterEach(() => localStorage.removeItem(KEY));

  const provide = () => {
    fixture.componentRef.setInput('lists', LISTS);
    fixture.detectChanges();
  };

  it('stores and emits the chosen list', () => {
    provide();
    component.select('drogerie');
    expect(localStorage.getItem(KEY)).toBe('drogerie');
    expect(component.targetId).toBe('drogerie');
    expect(emitted).toEqual(['drogerie']);
  });

  it('preselects and emits the stored list', () => {
    localStorage.setItem(KEY, 'shopping');
    provide();
    expect(component.targetId).toBe('shopping');
    expect(emitted).toEqual(['shopping']);
  });

  it('ignores a stored list that no longer exists', () => {
    localStorage.setItem(KEY, 'deleted');
    provide();
    expect(component.targetId).toBeNull();
    expect(emitted).toEqual([]);
  });

  it('works without localStorage', () => {
    spyOn(localStorage, 'getItem').and.throwError('denied');
    spyOn(localStorage, 'setItem').and.throwError('denied');
    provide();
    component.select('shopping');
    expect(component.targetId).toBe('shopping');
    expect(emitted).toEqual(['shopping']);
  });

  it('shows the label', () => {
    provide();
    expect(fixture.nativeElement.querySelector('mat-label').textContent).toContain('Senden an');
  });
});
