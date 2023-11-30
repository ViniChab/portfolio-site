import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GlobeComponent } from '../../components/globe/globe.component';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, GlobeComponent],
})
export class HomeComponent {}
