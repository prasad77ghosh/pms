import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BulkUploadResponse } from '../models/models';

export interface BulkUploadOptions {
    linesPerChunk?: number;
    persistence?: 'db' | 'rmq';
}

@Injectable({
    providedIn: 'root'
})
export class BulkUploadService {
    private apiUrl = `${environment.apiUrl}/upload-product`;

    constructor(private http: HttpClient) { }

    /**
     * Upload CSV file for bulk product import
     * POST /api/v1/upload-product/upload
     */
    uploadCSV(file: File, options: BulkUploadOptions = {}): Observable<BulkUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        if (options.linesPerChunk) {
            formData.append('linesPerChunk', options.linesPerChunk.toString());
        }

        if (options.persistence) {
            formData.append('persistence', options.persistence);
        }

        return this.http.post<BulkUploadResponse>(`${this.apiUrl}/upload`, formData).pipe(
            catchError(error => {
                console.error('Bulk upload error:', error);
                return throwError(() => error);
            })
        );
    }
}
