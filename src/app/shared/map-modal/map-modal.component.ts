import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';

import { LatLngTuple, Map, tileLayer, marker, Icon, icon } from 'leaflet';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements OnInit, AfterViewInit, OnDestroy {
  map: Map;
  clickListener: any;
  @Input() center: LatLngTuple = [-32.097972, -63.031309];
  @Input() selectable: boolean = true;
  @Input() closeButtonText: string = 'Cancel';
  @Input() title: string = 'Pick Location';

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.loadMap();
  }

  ngOnDestroy() {
    if (this.clickListener) {
      this.map.removeEventParent(this.clickListener);
    }
  }

  onCancel() {
    this.modalCtrl.dismiss();
  }

  private async loadMap() {
    const loadingMap = await this.loadingCtrl.create({ message: 'Loading...' });
    await loadingMap.present();

    this.map = new Map('map').setView(this.center, 16);
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    setTimeout(async () => {
      await loadingMap.dismiss();
      this.map.invalidateSize(true);
    }, 0);

    if (this.selectable) {
      this.clickListener = this.map.on('click', (event: any) => {
        const selectedCoords = {
          lat: event.latlng.lat,
          lng: event.latlng.lng,
        };
        this.modalCtrl.dismiss(selectedCoords);
      });
    } else {
      marker(this.center, {
        title: 'Picked Location',
        icon: icon({
          iconUrl: 'http://leafletjs.com/examples/custom-icons/leaf-red.png',
          iconSize: [12, 23],
        }),
      }).addTo(this.map);
    }
  }
}
