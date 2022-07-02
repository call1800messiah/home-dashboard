import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import firebase from 'firebase/compat';

import { ApiService } from './api.service';
import { AuthUser } from '../../auth/models/auth-user';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  redirectUrl = '/';
  user$: BehaviorSubject<AuthUser|null>;
  user: AuthUser | null;
  private firebaseUser$: Observable<firebase.User|null>;

  constructor(
    private api: ApiService,
    private router: Router,
  ) {
    this.user = null;
    this.user$ = new BehaviorSubject<AuthUser|null>(this.user);
    this.firebaseUser$ = this.api.getAuthState();
    this.firebaseUser$.subscribe(user => {
      if (user){
        this.user = AuthService.transformUser(user);
        this.user$.next(this.user);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        this.user$.next(null);
        localStorage.removeItem('user');
      }
    });
  }



  private static transformUser(firebaseUser: firebase.User): AuthUser|null {
    if (!firebaseUser || !firebaseUser.email) {
      return null;
    }

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
  }


  isLoggedIn(): Observable<boolean> {
    return this.firebaseUser$.pipe(
      map((user) => user !== null),
    );
  }


  login(email: string, password: string): void {
    this.api.login(email, password).then(() => {
      this.router.navigate([this.redirectUrl]);
      this.redirectUrl = '/';
    }).catch((error) => {
      console.error(error);
    });
  }


  logout(): void {
    this.api.logout().then(() => {
      this.router.navigate(['auth']);
    });
  }
}
