import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportStatus {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    file_path?: string;
    error?: string;
    created_at: string;
    completed_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private apiUrl = `${environment.apiUrl}/reports`;

    constructor(private http: HttpClient) { }

    requestReport(type: string = 'products', filters: any = {}): Observable<{ message: string; jobId: string }> {
        return this.http.post<{ message: string; jobId: string }>(`${this.apiUrl}/request`, { type, filters });
    }

    getReportStatus(jobId: string): Observable<ReportStatus> {
        return this.http.get<ReportStatus>(`${this.apiUrl}/status/${jobId}`);
    }

    downloadReport(jobId: string): void {
        window.open(`${this.apiUrl}/download/${jobId}`, '_blank');
    }
}
