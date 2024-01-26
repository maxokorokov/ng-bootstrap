import { afterNextRender, Component, ViewChild } from '@angular/core';
import { NgbDate, NgbDatepickerComponent, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { JsonPipe } from '@angular/common';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [NgbModule, JsonPipe],
	template: `
		<div class="container">
			<ngb-alert type="success" [dismissible]="false">
				This is a minimal CLI app for issue reproduction purposes
			</ngb-alert>
			<ngb-datepicker
				[minDate]="{ year: 2022, month: 5, day: 10 }"
				[maxDate]="{ year: 2030, month: 10, day: 28 }"
				[markDisabled]="markDisabled"
				zoom="d"
				[mode]="mode"
				[displayMonths]="displayMonths"
				[showWeekNumbers]="true"
				#dp="ngbDatepicker"
			>
			</ngb-datepicker>
			<div class="mt-3">
				<div ngbDropdown class="d-inline-block me-2">
					<button type="button" class="btn btn-sm btn-outline-primary" id="dropdownBasic1" ngbDropdownToggle>
						Months = {{ displayMonths }}
					</button>
					<div ngbDropdownMenu aria-labelledby="dropdownBasic1">
						<button ngbDropdownItem (click)="displayMonths = 1">1</button>
						<button ngbDropdownItem (click)="displayMonths = 2">2</button>
						<button ngbDropdownItem (click)="displayMonths = 3">3</button>
					</div>
				</div>

				<div ngbDropdown class="d-inline-block me-2">
					<button type="button" class="btn btn-sm btn-outline-primary" id="dropdownBasic1" ngbDropdownToggle>
						Select = {{ mode }}
					</button>
					<div ngbDropdownMenu aria-labelledby="dropdownBasic1">
						<button ngbDropdownItem (click)="mode = 'd'">Days</button>
						<button ngbDropdownItem (click)="mode = 'm'">Months</button>
						<button ngbDropdownItem (click)="mode = 'y'">Years</button>
					</div>
				</div>

				<div ngbDropdown class="d-inline-block me-2">
					<button type="button" class="btn btn-sm btn-outline-primary" id="dropdownBasic1" ngbDropdownToggle>
						Selection Mode = {{ dp.selectionManager.strategy }}
					</button>
					<div ngbDropdownMenu aria-labelledby="dropdownBasic1">
						<button ngbDropdownItem (click)="dp.selectionManager.strategy = 'single'">Single</button>
						<button ngbDropdownItem (click)="dp.selectionManager.strategy = 'toggle'">Toggle</button>
						<button ngbDropdownItem (click)="dp.selectionManager.strategy = 'multi'">Multiple</button>
					</div>
				</div>
			</div>
			<div class="mt-3">
				<button class="btn btn-sm btn-outline-primary me-2" (click)="dp.model.actions.prev()">prev</button>
				<button class="btn btn-sm btn-outline-primary me-2" (click)="dp.model.actions.next()">next</button>
				<button
					class="btn btn-sm btn-outline-primary me-2"
					(click)="dp.model.actions.zoomIn(dp.model.state.grids$()[0].firstDate)"
				>
					zoom in
				</button>
				<button class="btn btn-sm btn-outline-primary me-2" (click)="dp.model.actions.zoomOut()">zoom out</button>
				<button
					class="btn btn-sm btn-outline-primary me-2"
					(click)="dp.model.inputs.disabled$.set(!dp.model.state.disabled$())"
				>
					disabled
				</button>
				<button
					class="btn btn-sm btn-outline-primary me-2"
					(click)="dp.model.actions.open({ year: 2023, month: 12, day: 12 })"
				>
					Open 12.12.2023
				</button>
				<button
					class="btn btn-sm btn-outline-primary me-2"
					(click)="dp.model.actions.focus({ year: 2023, month: 12, day: 12 })"
				>
					Focus 12.12.2023
				</button>
			</div>
			<div class="mt-3">Selection: {{ dp.selectionManager.selectedDates$() | json }}</div>
			<div class="mt-3">
				<pre>First: {{ dp.model.state.firstDate$() | json }}</pre>
				<pre>Last: {{ dp.model.state.lastDate$() | json }}</pre>
				<pre>{{ dp.model.state.focusableDate$() | json }}</pre>
			</div>
		</div>
	`,
})
export class AppComponent {
	markDisabled = (date: NgbDate) => [7, 8].includes(date.day);
	mode = 'd';
	selection = 'single';
	displayMonths = 2;

	@ViewChild(NgbDatepickerComponent) dp: NgbDatepickerComponent;

	constructor() {
		afterNextRender(() => {});
	}
}
