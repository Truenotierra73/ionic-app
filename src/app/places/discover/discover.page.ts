import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { Place } from '../place.model';

import { PlacesService } from '../places.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {
  loadedPlaces: Place[] = [];
  relevantPlaces: Place[] = [];
  isLoading: boolean = false;
  private filter: string = 'all';
  private placesSubs: Subscription;

  constructor(
    private placesService: PlacesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.placesSubs = this.placesService.places.subscribe((places) => {
      this.loadedPlaces = places;
      this.onFilterUpdate(this.filter);
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    if (this.placesSubs) {
      this.placesSubs.unsubscribe();
    }
  }

  onFilterUpdate(filter: string) {
    this.authService.userId.pipe(take(1)).subscribe((userId) => {
      const isShown = (place) =>
        filter === 'all' || place.userId !== this.authService.userId;
      this.relevantPlaces = this.loadedPlaces.filter(isShown);
      this.filter = filter;
    });
  }
}
