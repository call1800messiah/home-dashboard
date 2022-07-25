import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
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
