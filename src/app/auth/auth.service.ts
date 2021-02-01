import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _userIsAuthenticated: boolean = true;
  private _userId: string;

  public get userIsAuthenticated(): boolean {
    return this._userIsAuthenticated;
  }

  public set userIsAuthenticated(value: boolean) {
    this._userIsAuthenticated = value;
  }

  public get userId(): string {
    return this._userId;
  }

  constructor() {}

  login() {
    this.userIsAuthenticated = true;
  }

  logout() {
    this.userIsAuthenticated = false;
  }
}
