import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SidebarComponent implements OnInit {
  isLoggedIn: Observable<boolean>;

  constructor(
    private auth: AuthService
  ) {
    this.isLoggedIn = this.auth.isLoggedIn();
  }

  ngOnInit(): void {
  }

}
