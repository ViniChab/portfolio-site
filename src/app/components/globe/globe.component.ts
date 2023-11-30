import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { take } from 'rxjs';

import { GlobeControllerService } from 'src/app/services/globe-controller/globe-controller.service';

@Component({
  selector: 'vini-globe',
  templateUrl: './globe.component.html',
  styleUrls: ['./globe.component.scss'],
  standalone: true,
  imports: [CommonModule],
  providers: [GlobeControllerService],
})
export class GlobeComponent implements AfterViewInit {
  @ViewChild('modelContainer', { static: true })
  public modelContainer!: ElementRef<HTMLDivElement>;
  public isLoading = true;
  public hasError = false;

  constructor(private globeControllerService: GlobeControllerService) {}

  public ngAfterViewInit() {
    const container = this.modelContainer.nativeElement;
    this.globeControllerService.prepareRenderer(container);
    this.globeControllerService.loadModel().then(
      () => (this.isLoading = false),
      () => (this.hasError = true)
    );

    this.globeControllerService.addLight();
    this.globeControllerService.setOrbitControls();
    this.globeControllerService.animateModel();
    this.globeControllerService.listenToResize();

    this.listenForInitialMovement();
  }

  private listenForInitialMovement() {
    this.globeControllerService.rotationFinishing$
      .pipe(take(1))
      .subscribe(() => {
        console.log('### LMAO?');
      });
  }
}
