import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulkUploadService } from '../../core/services/bulk-upload.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-upload.component.html'
})
export class BulkUploadComponent {
  bulkUploadService = inject(BulkUploadService);
  toast = inject(ToastService);

  isUploading = signal(false);
  uploadComplete = signal(false);
  uploadResult = signal<{ jobId: string; chunks: number } | null>(null);
  progress = signal(0);

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        this.toast.show('Please upload a CSV file', 'error');
        return;
      }
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    this.isUploading.set(true);
    this.uploadComplete.set(false);
    this.progress.set(0);

    this.bulkUploadService.uploadCSV(file, {
      linesPerChunk: 20000,
      persistence: 'db'
    }).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.uploadComplete.set(true);
        this.uploadResult.set({
          jobId: response.jobId,
          chunks: response.chunks
        });
        this.progress.set(100);
        this.toast.show(
          `Bulk upload started! Job ID: ${response.jobId}, Processing ${response.chunks} chunks`,
          'success'
        );
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.isUploading.set(false);
        this.toast.show('Failed to upload file', 'error');
      }
    });
  }

  reset() {
    this.uploadComplete.set(false);
    this.uploadResult.set(null);
  }
}
