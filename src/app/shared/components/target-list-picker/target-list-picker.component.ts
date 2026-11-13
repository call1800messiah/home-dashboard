import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

/** Dropdown of lists that remembers the chosen list under a storage key. */
@Component({
    selector: 'app-target-list-picker',
    templateUrl: './target-list-picker.component.html',
    styleUrls: ['./target-list-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TargetListPickerComponent implements OnChanges {
  @Input() lists: { id: string; name: string }[] | null = null;
  @Input({ required: true }) storageKey!: string;
  @Input({ required: true }) label!: string;
  @Output() targetChange = new EventEmitter<string>();
  targetId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['lists'] || this.targetId || !this.lists) {
      return;
    }
    const stored = this.readStored();
    if (stored && this.lists.some((list) => list.id === stored)) {
      this.targetId = stored;
      this.targetChange.emit(stored);
    }
  }

  select(id: string): void {
    this.targetId = id;
    try {
      localStorage.setItem(this.storageKey, id);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit only.
    }
    this.targetChange.emit(id);
  }

  private readStored(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }
}
