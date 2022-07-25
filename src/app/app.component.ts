import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDrawerMode } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  sideNavOpen: boolean = true;
  sideNavMode: MatDrawerMode = 'side';

  constructor(
    private breakpointObserver: BreakpointObserver
  ) {
    this.breakpointObserver.observe([
      Breakpoints.Handset
    ]).subscribe((result) => {
      if (result.matches) {
        this.sideNavOpen = false;
        this.sideNavMode = 'over';
      }
    });
  }

  toggleSidenav(): void {
    this.sideNavOpen = !this.sideNavOpen;
  }
}
