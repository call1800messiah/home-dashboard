import { Component, EventEmitter, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidenav = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  toggleClicked(): void {
    this.toggleSidenav.emit();
  }
}
