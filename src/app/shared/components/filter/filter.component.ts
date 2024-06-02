import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith, Subscription } from 'rxjs';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit, OnDestroy {
  @Input() text!: string;
  @Input() placeholder!: string;
  @Output() filterChanged = new EventEmitter<string>();
  textFilter!: UntypedFormControl;
  subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    this.textFilter = new UntypedFormControl(this.text || '');
    this.subscription.add(
      this.textFilter.valueChanges.pipe(
        startWith(this.text || ''),
        debounceTime(300),
        distinctUntilChanged(),
      ).subscribe((text) => {
        this.filterChanged.emit(text);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
