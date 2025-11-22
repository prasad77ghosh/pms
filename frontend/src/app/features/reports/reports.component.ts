import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html'
})
export class ReportsComponent {
  toast = inject(ToastService);

  download(reportType: string, format: string) {
    this.toast.show(`Downloading ${reportType} report in ${format.toUpperCase()} format...`, 'info');
    // Mock download
    setTimeout(() => {
      this.toast.show('Download completed', 'success');
    }, 1500);
  }
}
