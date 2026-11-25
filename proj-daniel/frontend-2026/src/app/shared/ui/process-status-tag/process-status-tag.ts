import { Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import {
  PROCESS_STATUS_LABELS,
  PROCESS_STATUS_SEVERITY,
  ProcessStatus,
} from '../../../core/models/service-order.model';

/** Etiqueta de color para el estado del proceso de una orden. */
@Component({
  host: { class: 'inline-block' },
  selector: 'app-process-status-tag',
  imports: [TagModule],
  template: `<p-tag [value]="label()" [severity]="severity()" [rounded]="true" />`,
})
export class ProcessStatusTag {
  readonly status = input.required<ProcessStatus>();
  readonly label = computed(() => PROCESS_STATUS_LABELS[this.status()]);
  readonly severity = computed(() => PROCESS_STATUS_SEVERITY[this.status()]);
}
