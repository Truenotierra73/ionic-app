import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  ActionSheetController,
  AlertController,
  ModalController,
} from '@ionic/angular';

import { Plugins, Capacitor } from '@capacitor/core';
const { Geolocation } = Plugins;

import { MapModalComponent } from '../../map-modal/map-modal.component';

import { Coordinates, PlaceLocation } from '../../../places/location.model';

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
  @Input() showPreview: boolean = false;
  @Output()
  locationPick: EventEmitter<PlaceLocation> = new EventEmitter<PlaceLocation>();

  constructor(
    private modalCtrl: ModalController,
    private httpClient: HttpClient,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}

  async onPickLocation() {
    const actionSheetElement = await this.actionSheetCtrl.create({
      header: 'Please Choose',
      buttons: [
        {
          text: 'Auto-Locate',
          handler: () => {
            this.locateUser();
          },
        },
        {
          text: 'Pick on Map',
          handler: () => {
            this.openMap();
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await actionSheetElement.present();
  }

  private async locateUser() {
    if (!Capacitor.isPluginAvailable('Geolocation')) {
      console.log('no disponible');

      this.showErrorAlert();
      return;
    }
    this.isLoading = true;
    Geolocation.getCurrentPosition()
      .then((geoPosition: any) => {
        const coordinates: Coordinates = {
          lat: geoPosition.coords.latitude,
          lng: geoPosition.coords.longitude,
        };
        this.createPlace(coordinates.lat, coordinates.lng);
        this.isLoading = false;
      })
      .catch((err: any) => {
        console.log(err);

        this.isLoading = false;
        this.showErrorAlert();
      });
  }

  private async showErrorAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Could not fetch location',
      message: 'Please use the map to pick a location!',
      backdropDismiss: false,
    });
    await alert.present();

    setTimeout(async () => {
      await alert.dismiss();
    }, 3500);
  }

  private async openMap() {
    const mapModal = await this.modalCtrl.create({
      component: MapModalComponent,
    });
    await mapModal.present();
    const { data } = await mapModal.onDidDismiss();
    if (!data) {
      return;
    }
    const coordinates: Coordinates = {
      lat: data.lat,
      lng: data.lng,
    };
    this.createPlace(coordinates.lat, coordinates.lng);
  }

  private createPlace(lat: number, lng: number) {
    const pickedLocation: PlaceLocation = {
      lat: lat,
      lng: lng,
      address: null,
      staticMapImageUrl: null,
    };
    this.isLoading = true;
    this.getAddress(lat, lng)
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
