import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ReportService } from '../../../core/services/report.service';
import { Product } from '../../../core/models/models';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, TableComponent, RouterLink, FormsModule, ModalComponent],
    templateUrl: './product-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {

    private productService = inject(ProductService);
    private router = inject(Router);
    private toast = inject(ToastService);
    private reportService = inject(ReportService);

    // Signals
    products = signal<Product[]>([]);
    total = signal(0);
    page = signal(1);
    limit = signal(10);
    isLoading = signal(false);
    isGeneratingReport = signal(false);

    // Search
    searchTerm = '';
    searchSubject = new Subject<string>();

    // Sorting
    sortKey = '';
    sortDir: 'asc' | 'desc' = 'asc';

    // Delete modal
    isDeleteModalOpen = false;
    productToDelete: Product | null = null;

    columns: TableColumn[] = [
        { key: 'image_url', label: 'Image', type: 'image', sortable: false },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'category_name', label: 'Category', sortable: true },
        { key: 'price', label: 'Price', type: 'currency', sortable: true },
        { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
    ];

    constructor() {
        // ✔ optimized search - no extra load
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(() => {
            this.page.set(1);
            this.loadProducts();
        });
    }

    // ✔ move heavy loading OUT of constructor
    ngOnInit() {
        this.loadProducts();
    }

    loadProducts() {
        this.isLoading.set(true);

        let sort: 'price_asc' | 'price_desc' | undefined;

        if (this.sortKey === 'price') {
            sort = this.sortDir === 'asc' ? 'price_asc' : 'price_desc';
        }

        this.productService.listProducts({
            page: this.page(),
            limit: this.limit(),
            search: this.searchTerm || undefined,
            sort
        }).subscribe({
            next: response => {
                if (response.success && response.data) {
                    const products = response.data.products.map(p => ({
                        ...p,
                        imageUrl: p.image_url,
                        categoryName: p.category_name,
                        categoryId: p.category_id
                    })) as Product[];

                    this.products.set(products);
                    this.total.set(response.data.total ?? response.data.products.length);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.toast.show('Failed to load products', 'error');
                this.isLoading.set(false);
            }
        });
    }

    onSearch(term: string) {
        this.searchTerm = term;
        this.searchSubject.next(term);
    }

    onSort(event: { key: string, direction: 'asc' | 'desc' }) {
        this.sortKey = event.key;
        this.sortDir = event.direction;
        this.loadProducts();
    }

    onPageChange(page: number) {
        this.page.set(page);
        this.loadProducts();
    }

    onEdit(product: Product) {
        this.router.navigate(['/products/edit', product.id]);
    }

    onDelete(product: Product) {
        this.productToDelete = product;
        this.isDeleteModalOpen = true;
    }

    confirmDelete() {
        if (!this.productToDelete?.id) return;

        this.productService.deleteProduct(this.productToDelete.id.toString()).subscribe({
            next: response => {
                if (response.success) {
                    this.toast.show('Product deleted successfully', 'success');
                    this.loadProducts();
                }
                this.isDeleteModalOpen = false;
                this.productToDelete = null;
            },
            error: () => {
                this.toast.show('Failed to delete product', 'error');
                this.isDeleteModalOpen = false;
            }
        });
    }

    downloadReport() {
        if (this.isGeneratingReport()) return;

        this.isGeneratingReport.set(true);
        this.toast.show('Generating report...', 'info');

        this.reportService.requestReport('products', { search: this.searchTerm }).subscribe({
            next: (res) => {
                this.pollReportStatus(res.jobId);
            },
            error: (err) => {
                console.error('Report request failed', err);
                this.isGeneratingReport.set(false);
                this.toast.show('Failed to start report generation', 'error');
            }
        });
    }

    pollReportStatus(jobId: string) {
        const poll = setInterval(() => {
            this.reportService.getReportStatus(jobId).subscribe({
                next: (status) => {
                    if (status.status === 'completed') {
                        clearInterval(poll);
                        this.isGeneratingReport.set(false);
                        this.toast.show('Report ready! Downloading...', 'success');
                        this.reportService.downloadReport(jobId);
                    } else if (status.status === 'failed') {
                        clearInterval(poll);
                        this.isGeneratingReport.set(false);
                        this.toast.show('Report generation failed', 'error');
                    }
                },
                error: () => {
                    clearInterval(poll);
                    this.isGeneratingReport.set(false);
                    this.toast.show('Error checking report status', 'error');
                }
            });
        }, 2000);
    }
}
