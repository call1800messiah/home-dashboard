import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith, Subscription } from 'rxjs';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit, OnDestroy {
  @Input() placeholder!: string;
  @Output() filterChanged = new EventEmitter<string>();
  textFilter: UntypedFormControl;
  subscription = new Subscription();

  constructor() {
    this.textFilter = new UntypedFormControl('');
    this.subscription.add(
      this.textFilter.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
      ).subscribe((text) => {
        this.filterChanged.emit(text);
      })
    );
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
