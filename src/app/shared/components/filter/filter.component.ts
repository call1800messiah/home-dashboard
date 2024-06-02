import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith, Subscription } from 'rxjs';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit, OnDestroy {
  @Input() storageKey?: string;
  @Input() placeholder!: string;
  @Output() filterChanged = new EventEmitter<string>();
  textFilter!: UntypedFormControl;
  subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    const initialText = this.storageKey ? localStorage.getItem(`filter-${this.storageKey}`) || '' : '';
    this.textFilter = new UntypedFormControl(initialText);
    this.subscription.add(
      this.textFilter.valueChanges.pipe(
        startWith(initialText),
        debounceTime(300),
        distinctUntilChanged(),
      ).subscribe((text) => {
        this.filterChanged.emit(text);
        if (this.storageKey) {
          localStorage.setItem(`filter-${this.storageKey}`, text);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
