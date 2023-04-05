import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { NgbDate } from './ngb-date';
import { NgbDatepickerI18n } from './datepicker-i18n';
import { NgbDatepickerZoom } from './ngb-calendar';

@Component({
	selector: '[ngbDatepickerCell]',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./datepicker-cell.scss'],
	host: {
		class: 'btn-light',
		'[class.bg-primary]': 'selected',
		'[class.text-white]': 'selected',
		'[class.text-muted]': 'muted',
		'[class.outside]': 'muted',
		'[class.active]': 'focused',
	},
	template: `{{ text }}`,
})
export class NgbDatepickerCell {
	@Input() date: NgbDate;
	@Input() disabled: boolean;
	@Input() focused: boolean;
	@Input() parentDate: NgbDate;
	@Input() selected: boolean;
	@Input() zoom: NgbDatepickerZoom;

	constructor(private i18n: NgbDatepickerI18n) {}

	get muted() {
		switch (this.zoom) {
			case 'days':
				return !this.selected && (this.date.month !== this.parentDate.month || this.disabled);
		}
		return false;
	}

	get text() {
		switch (this.zoom) {
			case 'days':
				return this.i18n.getDayNumerals(this.date);
			case 'months':
				return this.i18n.getMonthShortName(this.date.month, this.date.year);
			case 'years':
				return this.i18n.getYearNumerals(this.date.year);
		}

		return '';
	}
}
