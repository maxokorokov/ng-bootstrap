import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {NgbDate} from './ngb-date';
import {NgbDatepickerI18n} from './datepicker-i18n';
import {NgbCalendar, NgbDatepickerZoom} from './ngb-calendar';

@Component({
  selector: 'ngb-datepicker-navigation-zoom',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <button class="btn btn-outline-primary btn-sm" [disabled]="disabled" (click)="zoomOut.emit(date)">
      {{ label }}
    </button>
  `
})
export class NgbDatepickerNavigationZoom {
  @Input() date: NgbDate;
  @Input() disabled: boolean;
  @Input() zoom: NgbDatepickerZoom;

  @Output() zoomOut = new EventEmitter<NgbDate>();

  constructor(public i18n: NgbDatepickerI18n, public calendar: NgbCalendar) {}

  get label() {
    switch (this.zoom) {
      case 'days':
        return this.i18n.getMonthLabel(this.date);
      case 'months':
        return this.i18n.getYearNumerals(this.date.year);
      case 'years':
        const [rows, columns] = this.calendar.getGridForZoom(this.date, 'years');
        return this.date.year + ' - ' + (this.date.year + rows * columns - 1);
    }
    return '';
  }
}
