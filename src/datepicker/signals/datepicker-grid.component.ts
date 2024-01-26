import { Component, Directive, inject, Input, TemplateRef, ViewEncapsulation } from '@angular/core';
import { NGB_DATEPICKER, NgbDatepickerCell, NgbDatepickerDayGridContext, NgbDatepickerGrid } from './datepicker.state';
import { NgbPeriod } from './datepicker.calendar';
import { NgTemplateOutlet } from '@angular/common';
import { NgbDatepickerSelectionManager } from './datepicker.selection';

export interface NgbDatepickerCellContext {
	cell: NgbDatepickerCell;
	selected: boolean;
}

@Directive({
	selector: '[ngbDatepickerGrid]',
	standalone: true,
	host: {
		role: 'grid',
		class: 'ngb-dp-grid',
		'(keydown)': 'onKeyDown($event)',
	},
})
export class NgbDatepickerGridCommon {
	dp = inject(NGB_DATEPICKER);
	selection = inject(NgbDatepickerSelectionManager);

	@Input() grid: NgbDatepickerGrid;
	@Input() cellTemplate: TemplateRef<NgbDatepickerCellContext>;
	@Input() zoom: NgbPeriod;

	onKeyDown(event: KeyboardEvent) {
		this.dp.actions.handleKeydown(event);
	}

	onClick(cell: NgbDatepickerCell) {
		this.dp.actions.select(cell.date);
	}
}

/**
 * A component that renders one month including all the days, weekdays and week numbers. Can be used inside
 * the `<ng-template ngbDatepickerMonths></ng-template>` when you want to customize months layout.
 *
 * For a usage example, see [custom month layout demo](#/components/datepicker/examples#custommonth)
 *
 * @since 5.3.0
 */
@Component({
	selector: 'ngb-datepicker-month',
	standalone: true,
	imports: [NgTemplateOutlet],
	hostDirectives: [{ directive: NgbDatepickerGridCommon, inputs: ['grid', 'cellTemplate'] }],
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./datepicker.scss'],
	template: `
		<!--		<div *ngIf="context.weekdays.length > 0" class="ngb-dp-row ngb-dp-week ngb-dp-weekdays" role="row">-->
		<!--			<div *ngIf="dp.state.showWeekNumbers$()" class="ngb-dp-cell ngb-dp-weekday ngb-dp-showweek small">{{-->
		<!--				// i18n.getWeekLabel()-->
		<!--			}}</div>-->
		<!--			<div *ngFor="let weekday of context.weekdays" class="ngb-dp-cell ngb-dp-weekday small" role="columnheader">{{-->
		<!--				weekday-->
		<!--			}}</div>-->
		<!--		</div>-->
		@for (row of common.grid.rows; track row.id; let i = $index) {
			<div class="ngb-dp-row ngb-dp-week" role="row">
				@if (common.dp.state.showWeekNumbers$()) {
					<div class="ngb-dp-cell ngb-dp-week-number small text-muted">
						{{ context.weekNumbers[i] }}
					</div>
				}
				<!--				&lt;!&ndash;					[class.hidden]="cell.hidden"&ndash;&gt;-->
				<!--				&lt;!&ndash; [class.ngb-dp-today]="cell.context.today" &ndash;&gt;-->
				@for (cell of row.cells; track cell.id) {
					<div
						class="ngb-dp-cell ngb-dp-day"
						role="gridcell"
						(click)="common.onClick(cell); $event.preventDefault()"
						[tabindex]="cell.tabindex"
						[class.disabled]="cell.disabled"
						[attr.aria-label]="cell.ariaLabel"
					>
						<!--					<ng-template [ngIf]="!cell.hidden">-->
						<ng-template
							[ngTemplateOutlet]="common.cellTemplate"
							[ngTemplateOutletContext]="{ cell: cell, selected: common.selection.isSelected(cell.date) }"
						/>
						<!--					</ng-template>-->
					</div>
				}
			</div>
		}
	`,
})
export class NgbDatepickerMonthComponent {
	constructor(public common: NgbDatepickerGridCommon) {
		this.common.zoom = 'd';
	}

	get context() {
		return this.common.grid.context as NgbDatepickerDayGridContext;
	}
}

@Component({
	selector: 'ngb-datepicker-grid',
	standalone: true,
	imports: [NgTemplateOutlet],
	hostDirectives: [{ directive: NgbDatepickerGridCommon, inputs: ['zoom', 'grid', 'cellTemplate'] }],
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./datepicker.scss'],
	template: `
		@for (row of common.grid.rows; track row.id) {
			<div class="ngb-dp-row">
				@for (cell of row.cells; track cell.id) {
					<div
						class="ngb-dp-cell"
						role="gridcell"
						(click)="common.onClick(cell); $event.preventDefault()"
						[tabindex]="cell.tabindex"
						[class.disabled]="cell.disabled"
						[attr.aria-label]="cell.ariaLabel"
					>
						<ng-template
							[ngTemplateOutlet]="common.cellTemplate"
							[ngTemplateOutletContext]="{ cell: cell, selected: common.selection.isSelected(cell.date) }"
						/>
					</div>
				}
			</div>
		}
	`,
})
export class NgbDatepickerGridComponent {
	common = inject(NgbDatepickerGridCommon);
}
