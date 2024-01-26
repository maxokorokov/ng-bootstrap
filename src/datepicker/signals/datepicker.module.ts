import { NgModule } from '@angular/core';
import { NgbDatepickerComponent } from './datepicker.component';

export { NgbDatepickerComponent } from './datepicker.component';
export { NgbDate } from './ngb-date';
export { NgbDateStruct } from './ngb-date-struct';
export { NgbDatepickerCalendar, NgbPeriod } from './datepicker.calendar';
export { NgbDatepickerI18n, NgbDatepickerI18nDefault } from './datepicker.i18n';
export { NgbDatepickerConfig } from './datepicker.config';

const NGB_DATEPICKER_DIRECTIVES = [NgbDatepickerComponent];

@NgModule({
	exports: NGB_DATEPICKER_DIRECTIVES,
	imports: NGB_DATEPICKER_DIRECTIVES,
})
export class NgbDatepickerModule {}
