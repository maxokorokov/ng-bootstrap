import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { GridModel, NavigationEvent } from './datepicker-view-model';
import { NgbDate } from './ngb-date';
import { NgbDatepickerI18n } from './datepicker-i18n';
import { NgFor, NgForOf, NgIf, NgSwitch } from '@angular/common';
import { NgbDatepickerNavigationSelect } from './datepicker-navigation-select';
import { NgbDatepickerNavigationZoom } from './datepicker-navigation-zoom';
import { NgbDatepickerZoom } from './ngb-calendar';

@Component({
	selector: 'ngb-datepicker-navigation',
	standalone: true,
	imports: [NgIf, NgFor, NgForOf, NgbDatepickerNavigationSelect, NgbDatepickerNavigationZoom, NgSwitch],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./datepicker-navigation.scss'],
	template: `
		<div class="ngb-dp-arrow">
			<button
				type="button"
				class="btn btn-link ngb-dp-arrow-btn"
				(click)="onClickPrev($event)"
				[disabled]="prevDisabled"
				i18n-aria-label="@@ngb.datepicker.previous-month"
				aria-label="Previous month"
				i18n-title="@@ngb.datepicker.previous-month"
				title="Previous month"
			>
				<span class="ngb-dp-navigation-chevron"></span>
			</button>
		</div>
		<!--    <ngb-datepicker-navigation-select
			*ngIf="showSelect"
			class="ngb-dp-navigation-select"-->
		<!--      [date]="date"-->
		<!--[disabled]="disabled"-->
		<!--      [months]="selectBoxes.months"-->
		<!--      [years]="selectBoxes.years"-->
		<!--(select)="select.emit($event)"
		>-->
		<!--    </ngb-datepicker-navigation-select>-->

		<ngb-datepicker-navigation-zoom [date]="date" [disabled]="disabled" [zoom]="zoom" (zoomOut)="zoomOut.emit($event)">
		</ngb-datepicker-navigation-zoom>

		<ng-template *ngIf="!showSelect" ngFor let-grid [ngForOf]="grids" let-i="index">
			<div class="ngb-dp-arrow" *ngIf="i > 0"></div
			><ng-template [ngSwitch]="zoom">
				<div *ngSwitchCase="'days'" class="ngb-dp-month-name">
					{{ i18n.getMonthLabel(grid.firstDate) }}
				</div>
				<div *ngSwitchCase="'months'" class="ngb-dp-year-name">
					{{ i18n.getYearNumerals(grid.firstDate.year) }}
				</div>
				<div *ngSwitchCase="'years'" class="ngb-dp-decade-name">
					{{ grid.firstDate.year }}
				</div>
			</ng-template>
			<div class="ngb-dp-arrow" *ngIf="i !== grids.length - 1"></div>
		</ng-template>
		<div class="ngb-dp-arrow right">
			<button
				type="button"
				class="btn btn-link ngb-dp-arrow-btn"
				(click)="onClickNext($event)"
				[disabled]="nextDisabled"
				i18n-aria-label="@@ngb.datepicker.next-month"
				aria-label="Next month"
				i18n-title="@@ngb.datepicker.next-month"
				title="Next month"
			>
				<span class="ngb-dp-navigation-chevron"></span>
			</button>
		</div>
	`,
})
export class NgbDatepickerNavigation {
	navigation = NavigationEvent;

	@Input() date: NgbDate;
	@Input() disabled: boolean;
	@Input() grids: GridModel[] = [];
	@Input() showSelect: boolean;
	@Input() prevDisabled: boolean;
	@Input() nextDisabled: boolean;
	@Input() selectBoxes: { years: number[]; months: number[] };
	@Input() zoom: NgbDatepickerZoom;

	@Output() navigate = new EventEmitter<NavigationEvent>();
	@Output() select = new EventEmitter<NgbDate>();
	@Output() zoomOut = new EventEmitter<NgbDate>();

	constructor(public i18n: NgbDatepickerI18n) {}

	onClickPrev(event: MouseEvent) {
		(event.currentTarget as HTMLElement).focus();
		this.navigate.emit(this.navigation.PREV);
	}

	onClickNext(event: MouseEvent) {
		(event.currentTarget as HTMLElement).focus();
		this.navigate.emit(this.navigation.NEXT);
	}
}
