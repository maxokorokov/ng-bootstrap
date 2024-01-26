import { inject, Injectable, signal } from '@angular/core';
import { NGB_DATEPICKER } from './datepicker.state';
import { NgbDate } from './ngb-date';
import { NgbDateStruct } from './ngb-date-struct';

@Injectable()
export class NgbDatepickerSelectionManager {
	private _dp = inject(NGB_DATEPICKER);
	private _strategy: 'single' | 'toggle' | 'multi' | 'range' = 'single';

	selectedDates$ = signal<NgbDate[]>([]);

	set strategy(strategy: 'single' | 'toggle' | 'multi' | 'range') {
		if (this._strategy !== strategy) {
			this._strategy = strategy;
			this.selectedDates$.set([]);
		}
	}

	get strategy() {
		return this._strategy;
	}

	isSelected(date: NgbDateStruct) {
		return this.selectedDates$().some((d) => d.equals(date));
	}

	constructor() {
		this._dp.events.selections$.subscribe((date) => {
			switch (this._strategy) {
				case 'single':
					this.selectedDates$.set([date]);
					break;
				case 'toggle':
					if (this.isSelected(date)) {
						this.selectedDates$.set([]);
					} else {
						this.selectedDates$.set([date]);
					}
					break;
				case 'multi':
					if (this.isSelected(date)) {
						this.selectedDates$.set(this.selectedDates$().filter((d) => !d.equals(date)));
					} else {
						this.selectedDates$.set([...this.selectedDates$(), date]);
					}
					break;
				case 'range':
					break;
			}
		});
	}
}
