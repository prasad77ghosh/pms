import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-upload.component.html'
})
export class BulkUploadComponent {
  toast = inject(ToastService);

  isUploading = false;
  uploadComplete = false;
  progress = 0;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        this.toast.show('Please upload a CSV file', 'error');
        return;
      }
      this.simulateUpload();
    }
  }

  simulateUpload() {
    this.isUploading = true;
    this.progress = 0;
    const interval = setInterval(() => {
      this.progress += 10;
      if (this.progress >= 100) {
        clearInterval(interval);
        this.isUploading = false;
        this.uploadComplete = true;
        this.toast.show('Bulk upload completed', 'success');
      }
    }, 300);
  }

  reset() {
    this.uploadComplete = false;
    this.progress = 0;
  }
}
