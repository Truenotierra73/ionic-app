import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';

import { Observable } from 'rxjs';

import { AuthService, AuthResponseData } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading: boolean = false;
  isLogin: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}

  async authenticate(email: string, password: string) {
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Logging in...',
      backdropDismiss: false,
      keyboardClose: true,
    });
    await loading.present();
    let authObs: Observable<AuthResponseData>;
    if (this.isLogin) {
      authObs = this.authService.login(email, password);
    } else {
      authObs = this.authService.singup(email, password);
    }
    authObs.subscribe(
      (resData: any) => {
        this.isLoading = false;
        loading.dismiss();
        this.router.navigate(['/places/tabs/discover']);
      },
      (errRes: any) => {
        this.isLoading = false;
        loading.dismiss();
        const code = errRes.error.error.message;
        let msg = 'Could not sign you up, please try again.';
        if (code === 'EMAIL_EXISTS') {
          msg = 'This email address exists already!';
        } else if (code === 'EMAIL_NOT_FOUND') {
          msg = 'E-mail address could not be found.';
        } else if (code === 'INVALID_PASSWORD') {
          msg = 'This password is not correct.';
        }
        this.showAlert(msg);
      }
    );
  }

  onSubmit(form: NgForm) {
    console.log(form);

    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;
    console.log(email, password);
    this.authenticate(email, password);
    form.reset();
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }

  private async showAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Authentication failed',
      message,
      buttons: ['Okay'],
    });

    await alert.present();
  }
}
