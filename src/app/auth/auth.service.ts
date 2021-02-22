import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';

import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { Plugins } from '@capacitor/core';
const { Storage } = Plugins;

import { User } from './user.model';

import { environment } from '../../environments/environment';

export interface AuthResponseData {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private firebaseKey: string = environment.firebaseKey;
  private _user: BehaviorSubject<User> = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;

  public get userIsAuthenticated(): Observable<boolean> {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) {
          return !!user.token;
        } else {
          return false;
        }
      })
    );
  }

  public get userId(): Observable<string> {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) {
          return user.id;
        } else {
          return null;
        }
      })
    );
  }

  constructor(private httpClient: HttpClient) {}

  ngOnDestroy() {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
  }

  singup(email: string, password: string) {
    return this.httpClient
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.firebaseKey}`,
        { email, password, returnSecureToken: true }
      )
      .pipe(
        tap((userData) => {
          this.setUserData(userData);
        })
      );
  }

  login(email: string, password: string) {
    return this.httpClient
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.firebaseKey}`,
        { email, password, returnSecureToken: true }
      )
      .pipe(
        tap((userData) => {
          this.setUserData(userData);
        })
      );
  }

  autoLogin() {
    return from(Storage.get({ key: 'authData' })).pipe(
      map((storedData) => {
        if (!storedData || !storedData.value) {
          return null;
        }
        const parsedData = JSON.parse(storedData.value) as {
          userId: string;
          email: string;
          token: string;
          tokenExpirationDate: string;
        };
        const expirationDate = new Date(parsedData.tokenExpirationDate);
        if (expirationDate <= new Date()) {
          return null;
        }
        const user = new User(
          parsedData.userId,
          parsedData.email,
          parsedData.token,
          expirationDate
        );
        return user;
      }),
      tap((user) => {
        if (user) {
          this._user.next(user);
          this.autoLogout(user.tokenDuration);
        }
      }),
      map((user) => {
        return !!user;
      })
    );
  }

  logout() {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    this._user.next(null);
    Storage.remove({ key: 'authData' });
  }

  private autoLogout(duration: number) {
    if (this.activeLogoutTimer) {
      clearTimeout(this.activeLogoutTimer);
    }
    this.activeLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  private setUserData(userData: AuthResponseData) {
    const expirationTime = new Date(
      new Date().getTime() + +userData.expiresIn * 1000
    );
    const user = new User(
      userData.localId,
      userData.email,
      userData.idToken,
      expirationTime
    );
    this._user.next(user);
    this.autoLogout(user.tokenDuration);
    this.storeAuthData(
      userData.localId,
      userData.email,
      userData.idToken,
      expirationTime.toISOString()
    );
  }

  private async storeAuthData(
    userId: string,
    email: string,
    token: string,
    tokenExpirationDate: string
  ) {
    const data = {
      userId,
      email,
      token,
      tokenExpirationDate,
    };

    await Storage.set({ key: 'authData', value: JSON.stringify(data) });
  }

  get token() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) {
          return user.token;
        } else {
          return null;
        }
      })
    );
  }
}
