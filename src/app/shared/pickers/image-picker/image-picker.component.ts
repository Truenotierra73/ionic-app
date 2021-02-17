import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Platform } from '@ionic/angular';

import {
  Plugins,
  Capacitor,
  CameraSource,
  CameraResultType,
} from '@capacitor/core';
const { Camera } = Plugins;

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {
  @Input() showPreview: boolean = false;
  @Output() imagePick: EventEmitter<string | File> = new EventEmitter<
    string | File
  >();
  @ViewChild('filePicker') filePickerRef: ElementRef<HTMLInputElement>;
  selectedImage: string;
  userPicker: boolean = false;

  constructor(private platform: Platform) {}

  ngOnInit() {
    if (
      (this.platform.is('mobile') && !this.platform.is('hybrid')) ||
      this.platform.is('desktop')
    ) {
      this.userPicker = true;
    }
  }

  async onPickImage() {
    if (!Capacitor.isPluginAvailable('Camera')) {
      this.filePickerRef.nativeElement.click();
      return;
    }

    await Camera.getPhoto({
      quality: 50,
      source: CameraSource.Prompt,
      correctOrientation: true,
      height: 320,
      width: 600,
      resultType: CameraResultType.Base64,
    })
      .then((image) => {
        this.selectedImage = 'data:image/jpeg;base64,' + image.base64String;
        this.onPickedImageEvent(this.selectedImage);
      })
      .catch((error) => {
        if (this.userPicker) {
          this.filePickerRef.nativeElement.click();
        }
        console.log(error);
      });
  }

  onPickedImageEvent(imagePick: string | File) {
    this.imagePick.emit(imagePick);
  }

  onFileChosen(ev: Event) {
    const pickedFile = (ev.target as HTMLInputElement).files[0];
    if (!pickedFile) {
      return;
    }
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = fr.result.toString();
      this.selectedImage = dataUrl;
      this.onPickedImageEvent(pickedFile);
    };
    fr.readAsDataURL(pickedFile);
  }
}
