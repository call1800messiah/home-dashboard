import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(
    private auth: AuthService
  ) { }

  ngOnInit(): void {}

  login() {
    if (!this.loginForm.value.email || !this.loginForm.value.password) {
      return;
    }

    this.auth.login(
      this.loginForm.value.email,
      this.loginForm.value.password,
    );
  }
}
