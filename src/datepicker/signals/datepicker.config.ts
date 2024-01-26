import { Injectable, TemplateRef } from '@angular/core';
import { TranslationWidth } from '@angular/common';

import { NgbDateStruct } from './ngb-date-struct';
import { NgbPeriod } from './datepicker.calendar';
import { NgbDate } from './ngb-date';
import { NgbDatepickerCellContext } from './datepicker-grid.component';

/**
 * A configuration service for the [`NgbDatepicker`](#/components/datepicker/api#NgbDatepicker) component.
 *
 * You can inject this service, typically in your root component, and customize the values of its properties in
 * order to provide default values for all the datepickers used in the application.
 */
@Injectable({ providedIn: 'root' })
export class NgbDatepickerConfig {
	cellTemplate: TemplateRef<NgbDatepickerCellContext>;
	dayTemplateData: (date: NgbDateStruct, current?: { year: number; month: number }) => any;
	footerTemplate: TemplateRef<any>;
	displayMonths = 1;
	firstDayOfWeek = 1;
	markDisabled: (date: NgbDate, zoom: NgbPeriod) => boolean;
	minDate: NgbDateStruct;
	maxDate: NgbDateStruct;
	mode: NgbPeriod = 'd';
	navigation: 'select' | 'arrows' | 'none' = 'select';
	outsideDays: 'visible' | 'collapsed' | 'hidden' = 'visible';
	showWeekNumbers = false;
	startDate: { year: number; month: number; day: number };
	weekdays: TranslationWidth | false = TranslationWidth.Short;
	zoom: NgbPeriod = 'd';
}
