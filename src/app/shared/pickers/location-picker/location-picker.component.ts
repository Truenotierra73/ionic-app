import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { ModalController } from '@ionic/angular';

import { MapModalComponent } from '../../map-modal/map-modal.component';

import { PlaceLocation } from 'src/app/places/location.model';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  private locationIQ = {
    reverseBaseUrl: environment.locationIQ.reverseBaseUrl,
    staticMapBaseUrl: environment.locationIQ.staticMapBaseUrl,
    apiKey: environment.locationIQ.apiKey,
  };
  selectedLocationImage: string;
  isLoading: boolean = false;
  @Output()
  locationPick: EventEmitter<PlaceLocation> = new EventEmitter<PlaceLocation>();

  constructor(
    private modalCtrl: ModalController,
    private httpClient: HttpClient
  ) {}

  ngOnInit() {}

  async onPickLocation() {
    const mapModal = await this.modalCtrl.create({
      component: MapModalComponent,
    });
    await mapModal.present();
    const { data } = await mapModal.onDidDismiss();
    if (!data) {
      return;
    }
    const pickedLocation: PlaceLocation = {
      lat: data.lat,
      lng: data.lng,
      address: null,
      staticMapImageUrl: null,
    };
    this.isLoading = true;
    this.getAddress(data.lat, data.lng)
      .pipe(
        switchMap((address) => {
          pickedLocation.address = address;
          return of(
            this.getMapImage(pickedLocation.lat, pickedLocation.lng, 16)
          );
        })
      )
      .subscribe((staticMapImageUrl: any) => {
        pickedLocation.staticMapImageUrl = staticMapImageUrl;
        this.selectedLocationImage = staticMapImageUrl;
        this.isLoading = false;
        this.onPickedLocationEvent(pickedLocation);
      });
  }

  private getAddress(lat: number, lng: number) {
    const params = new HttpParams()
      .append('key', this.locationIQ.apiKey)
      .append('lat', `${lat}`)
      .append('lon', `${lng}`)
      .append('format', 'json');

    return this.httpClient
      .get<any>(this.locationIQ.reverseBaseUrl, { params })
      .pipe(
        map((data: any) => {
          return data.display_name;
        })
      );
  }

  private getMapImage(lat: number, lng: number, zoom: number) {
    return (
      this.locationIQ.staticMapBaseUrl +
      `?key=${this.locationIQ.apiKey}&center=${lat},${lng}&zoom=${zoom}&markers=icon:${lat},${lng}`
    );
  }

  onPickedLocationEvent(pickedLocation: PlaceLocation) {
    this.locationPick.emit(pickedLocation);
  }
}
