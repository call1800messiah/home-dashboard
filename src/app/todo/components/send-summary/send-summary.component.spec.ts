import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { SendSummaryComponent } from './send-summary.component';
import { TodoModule } from '../../todo.module';
import { testModule } from '../../../testing/test-module';
import type { SendSummaryData } from '../../models/send-summary-data';

describe('SendSummaryComponent', () => {
  let fixture: ComponentFixture<SendSummaryComponent>;

  const data: SendSummaryData = {
    targetName: 'Einkaufsliste',
    summary: {
      closeMatches: ['Tomate → Tomaten'],
      reopened: ['Milch', 'Brot'],
      quantityChanged: [],
      added: ['Joghurt'],
      alreadyOpen: [],
    },
  };

  beforeEach(async () => {
    const module = testModule(TodoModule);
    await TestBed.configureTestingModule({
      ...module,
      providers: [...module.providers!, { provide: MAT_DIALOG_DATA, useValue: data }],
    }).compileComponents();

    fixture = TestBed.createComponent(SendSummaryComponent);
    fixture.detectChanges();
  });

  it('shows the title and only non-empty groups, in order', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('An Einkaufsliste gesendet');
    const headings = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.group-title'))
      .map((element) => element.textContent?.trim());
    expect(headings).toEqual(['Ähnlicher Name verwendet (1)', 'Wieder offen (2)', 'Neu hinzugefügt (1)']);
    expect(text).toContain('Tomate → Tomaten');
    expect(text).toContain('Milch, Brot');
    expect(text).toContain('Joghurt');
  });

  it('closes on OK', () => {
    const close = spyOn(TestBed.inject(MatDialogRef), 'close');
    fixture.nativeElement.querySelector('button').click();
    expect(close).toHaveBeenCalled();
  });
});
