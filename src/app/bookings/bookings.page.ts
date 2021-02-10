import { Component, OnDestroy, OnInit } from '@angular/core';
import { IonItemSliding, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { Booking } from './booking.model';

import { BookingsService } from './bookings.service';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {
  loadedBookings: Booking[];
  isLoading: boolean = false;
  private bookingSubs: Subscription;

  constructor(
    private bookingsService: BookingsService,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.bookingSubs = this.bookingsService.bookings.subscribe((bookings) => {
      this.loadedBookings = bookings;
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.bookingsService.fetchBookings().subscribe(() => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    if (this.bookingSubs) {
      this.bookingSubs.unsubscribe();
    }
  }

  async onCancelBooking(bookingId: string, bookingSliding: IonItemSliding) {
    bookingSliding.close();
    const loading = await this.loadingCtrl.create({
      message: 'Cancelling...',
    });
    await loading.present();
    this.bookingsService.cancelBooking(bookingId).subscribe(async () => {
      await loading.dismiss();
    });
  }
}
