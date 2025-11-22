import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulkUploadService } from '../../../../core/services/bulk-upload.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
    selector: 'app-bulk-upload-modal',
    standalone: true,
    imports: [CommonModule, ModalComponent],
    templateUrl: './bulk-upload-modal.component.html'
})
export class BulkUploadModalComponent {
    @Input() isOpen = false;
    @Output() closeEvent = new EventEmitter<void>();
    @Output() uploadSuccess = new EventEmitter<void>();

    bulkUploadService = inject(BulkUploadService);
    toast = inject(ToastService);

    isUploading = signal(false);
    uploadComplete = signal(false);
    uploadResult = signal<{ jobId: string; chunks: number } | null>(null);
    progress = signal(0);

    close() {
        this.closeEvent.emit();
        // Reset state on close if needed, or keep it? 
        // Better to reset if completed, but if uploading, maybe warn?
        // For now, simple close.
        if (this.uploadComplete()) {
            this.reset();
        }
    }

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
            linesPerChunk: 10000,
            persistence: 'db'
        }).subscribe({
            next: (response) => {
                this.uploadResult.set({
                    jobId: response.jobId,
                    chunks: response.chunks
                });

                this.pollStatus(response.jobId);
            },
            error: (error) => {
                console.error('Upload error:', error);
                this.isUploading.set(false);
                this.toast.show('Failed to upload file', 'error');
            }
        });
    }

    pollStatus(jobId: string) {
        const pollInterval = 2000; // 2 seconds
        const maxAttempts = 300; // 10 minutes timeout
        let attempts = 0;

        const poll = setInterval(() => {
            attempts++;
            this.bulkUploadService.getJobStatus(jobId).subscribe({
                next: (status) => {
                    if (status) {
                        const percentage = Math.round((status.completed / status.total) * 100);
                        this.progress.set(percentage);

                        if (status.completed === status.total) {
                            clearInterval(poll);
                            this.isUploading.set(false);
                            this.uploadComplete.set(true);
                            this.progress.set(100);
                            this.toast.show('Bulk upload completed successfully!', 'success');
                            this.uploadSuccess.emit();
                        }
                    }
                },
                error: (err) => {
                    console.error('Polling error:', err);
                }
            });

            if (attempts >= maxAttempts) {
                clearInterval(poll);
                this.isUploading.set(false);
                this.toast.show('Upload processing timed out', 'error');
            }
        }, pollInterval);
    }

    reset() {
        this.uploadComplete.set(false);
        this.uploadResult.set(null);
        this.progress.set(0);
    }
}
