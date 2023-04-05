import { NgbDate } from './ngb-date';
import { NgbDateStruct } from './ngb-date-struct';
import { DayTemplateContext } from './datepicker-day-template-context';
import { TranslationWidth } from '@angular/common';
import { NgbDatepickerZoom } from './ngb-calendar';
import { MonthTemplateContext } from './datepicker-month-template-context';

export type NgbMarkDisabled = (date: NgbDateStruct, current?: { year: number; month: number }) => boolean;
export type NgbDayTemplateData = (date: NgbDateStruct, current?: { year: number; month: number }) => any;

export type CellModel = {
	date: NgbDate;
	context: DayTemplateContext | MonthTemplateContext;
	tabindex: number;
	ariaLabel: string;
	hidden: boolean;
};

export type RowWeekContext = {
	week: number;
};

export type RowModel = {
	cells: CellModel[];
	context?: RowWeekContext;
};

export type GridMonthContext = {
	month: number;
	year: number;
	weekdays: string[];
};

export type GridYearContext = {
	year: number;
};

export type GridDecadeContext = {
	year: number;
};

export type GridModel = MonthViewModel | YearViewModel | DecadeViewModel;

export type MonthViewModel = {
	zoom: 'days';
	firstDate: NgbDate;
	lastDate: NgbDate;
	context: GridMonthContext;
	rows: RowModel[];
};

export type YearViewModel = {
	zoom: 'months';
	firstDate: NgbDate;
	lastDate: NgbDate;
	context: GridYearContext;
	rows: RowModel[];
};

export type DecadeViewModel = {
	zoom: 'years';
	firstDate: NgbDate;
	lastDate: NgbDate;
	context: GridDecadeContext;
	rows: RowModel[];
};

export type DatepickerViewModel = {
	dayTemplateData: NgbDayTemplateData | null;
	disabled: boolean;
	displayMonths: number;
	firstDate: NgbDate | null;
	firstDayOfWeek: number;
	focusDate: NgbDate | null;
	focusVisible: boolean;
	lastDate: NgbDate | null;
	markDisabled: NgbMarkDisabled | null;
	maxDate: NgbDate | null;
	minDate: NgbDate | null;
	mode: NgbDatepickerZoom;
	grids: GridModel[];
	navigation: 'select' | 'arrows' | 'zoom' | 'none';
	outsideDays: 'visible' | 'collapsed' | 'hidden';
	prevDisabled: boolean;
	nextDisabled: boolean;
	selectBoxes: {
		years: number[];
		months: number[];
	};
	selectedDate: NgbDate | null;
	weekdayWidth: TranslationWidth;
	weekdaysVisible: boolean;
	zoom: NgbDatepickerZoom;
};

export enum NavigationEvent {
	PREV,
	NEXT,
}
