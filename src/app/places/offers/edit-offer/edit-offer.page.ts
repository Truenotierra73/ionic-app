import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  AlertController,
  LoadingController,
  NavController,
} from '@ionic/angular';

import { Place } from '../../place.model';

import { PlacesService } from '../../places.service';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {
  place: Place;
  placeId: string;
  form: FormGroup;
  isLoading: boolean = false;
  private placeSubs: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private placesService: PlacesService,
    private navCtrl: NavController,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((paramMap) => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/offers');
        return;
      }
      this.placeId = paramMap.get('placeId');
      this.isLoading = true;
      this.placeSubs = this.placesService
        .getPlace(paramMap.get('placeId'))
        .subscribe(
          (place) => {
            this.place = place;
            this.form = new FormGroup({
              title: new FormControl(this.place.title, {
                updateOn: 'blur',
                validators: [Validators.required],
              }),
              description: new FormControl(this.place.description, {
                updateOn: 'blur',
                validators: [Validators.required, Validators.maxLength(180)],
              }),
            });
            this.isLoading = false;
          },
          async (error: any) => {
            this.isLoading = false;
            const alertErr = await this.alertCtrl.create({
              header: 'An error occurred!',
              message: 'Place could not be fetched. Please try again later.',
              buttons: [
                {
                  text: 'Ok',
                  handler: () => {
                    this.router.navigate(['/places/tabs/offers']);
                  },
                },
              ],
              backdropDismiss: false,
            });
            await alertErr.present();
          }
        );
    });
  }

  ngOnDestroy() {
    if (this.placeSubs) {
      this.placeSubs.unsubscribe();
    }
  }

  public get description() {
    return this.form.get('description');
  }

  async onUpdateOffer() {
    if (!this.form.valid) {
      return;
    }
    const updatePlaceLoading = await this.loadingCtrl.create({
      message: 'Updating place...',
    });
    await updatePlaceLoading.present();
    this.placesService
      .updatePlace(
        this.place.id,
        this.form.value.title,
        this.form.value.description
      )
      .subscribe(async () => {
        await updatePlaceLoading.dismiss();
        this.form.reset();
        this.router.navigate(['/places/tabs/offers']);
      });
  }
}
