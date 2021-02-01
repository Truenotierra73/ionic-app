import { Injectable } from '@angular/core';

import { Booking } from './booking.model';

@Injectable({
  providedIn: 'root',
})
export class BookingsService {
  private _bookings: Booking[] = [
    new Booking('xyz', 'p1', 'abc', 'Manhattan Mansion', 2),
  ];

  public get bookings(): Booking[] {
    return [...this._bookings];
  }

  constructor() {}
}
