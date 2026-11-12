import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import type { SendSummaryData } from '../../models/send-summary-data';
import type { SendSummary } from '../../services/send-items';

interface SummaryGroup {
  key: keyof SendSummary;
  title: string;
  entries: string;
  count: number;
}

const GROUP_TITLES: [keyof SendSummary, string][] = [
  ['closeMatches', 'Ähnlicher Name verwendet'],
  ['reopened', 'Wieder offen'],
  ['quantityChanged', 'Menge geändert'],
  ['added', 'Neu hinzugefügt'],
  ['alreadyOpen', 'War schon offen'],
];



@Component({
    selector: 'app-send-summary',
    templateUrl: './send-summary.component.html',
    styleUrls: ['./send-summary.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SendSummaryComponent {
  readonly groups: SummaryGroup[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SendSummaryData,
  ) {
    this.groups = GROUP_TITLES
      .map(([key, title]) => ({ key, title, entries: data.summary[key].join(', '), count: data.summary[key].length }))
      .filter((group) => group.count > 0);
  }
}
