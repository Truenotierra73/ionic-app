import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  ActionSheetController,
  LoadingController,
  ModalController,
  NavController,
} from '@ionic/angular';

import { CreateBookingComponent } from '../../../bookings/create-booking/create-booking.component';

import { Place } from '../../place.model';

import { PlacesService } from '../../places.service';
import { BookingsService } from '../../../bookings/bookings.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place;
  isBookable: boolean = false;
  private placeSubs: Subscription;

  constructor(
    private navCtrl: NavController,
    private activatedRoute: ActivatedRoute,
    private placesService: PlacesService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingsService: BookingsService,
    private loadingCtrl: LoadingController,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((paramMap) => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/discover');
        return;
      }
      this.placeSubs = this.placesService
        .getPlace(paramMap.get('placeId'))
        .subscribe((place) => {
          this.place = place;
          this.isBookable = place.userId !== this.authService.userId;
        });
    });
  }

  ngOnDestroy() {
    if (this.placeSubs) {
      this.placeSubs.unsubscribe();
    }
  }

  async onBookPlace() {
    // this.navCtrl.navigateBack(['/places/tabs/discover']);
    const actionSheetBooking = await this.actionSheetCtrl.create({
      header: 'Choose an Action',
      buttons: [
        {
          text: 'Select Date',
          handler: () => {
            this.openBookingModal('select');
          },
        },
        {
          text: 'Random Date',
          handler: () => {
            this.openBookingModal('random');
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await actionSheetBooking.present();
  }

  async openBookingModal(mode: 'select' | 'random') {
    const createBookingModal = await this.modalCtrl.create({
      component: CreateBookingComponent,
      componentProps: {
        selectedPlace: this.place,
        selectedMode: mode,
      },
    });
    await createBookingModal.present();
    const { data, role } = await createBookingModal.onWillDismiss();
    const loading = await this.loadingCtrl.create({
      message: 'Booking place...',
    });
    if (role === 'confirm') {
      await loading.present();
      this.bookingsService
        .addBooking(
          this.place.id,
          this.place.title,
          this.place.imageUrl,
          data.bookingData.firstName,
          data.bookingData.lastName,
          data.bookingData.guestNumber,
          data.bookingData.startDate,
          data.bookingData.endDate
        )
        .subscribe(async () => {
          await loading.dismiss();
        });
    }
  }
}
