import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Product } from '../../../core/models/models';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, TableComponent, RouterLink, FormsModule, ModalComponent],
    templateUrl: './product-list.component.html'
})
export class ProductListComponent {
    productService = inject(ProductService);
    router = inject(Router);
    toast = inject(ToastService);

    products = signal<Product[]>([]);
    total = signal(0);
    page = signal(1);
    limit = signal(10);
    isLoading = signal(false);

    searchTerm = '';
    searchSubject = new Subject<string>();

    sortKey = '';
    sortDir: 'asc' | 'desc' = 'asc';

    isDeleteModalOpen = false;
    productToDelete: Product | null = null;

    // New modal for creating a product
    isCreateModalOpen = signal(false);


    columns: TableColumn[] = [
        { key: 'image_url', label: 'Image', type: 'image', sortable: false },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'category_name', label: 'Category', sortable: true },
        { key: 'price', label: 'Price', type: 'currency', sortable: true },
        { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
    ];

    constructor() {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(term => {
            this.page.set(1);
            this.loadProducts();
        });

        // Initial Load
        this.loadProducts();
    }

    // Open/close create modal
    openCreateModal() {
        this.isCreateModalOpen.set(true);
    }

    closeCreateModal() {
        this.isCreateModalOpen.set(false);
    }

    // Called when a product is successfully created via modal
    onProductCreated() {
        this.closeCreateModal();
        this.loadProducts();
    }

    loadProducts() {
        this.isLoading.set(true);

        // Map frontend sort format to backend format
        let sort: 'price_asc' | 'price_desc' | undefined = undefined;
        if (this.sortKey === 'price') {
            sort = this.sortDir === 'asc' ? 'price_asc' : 'price_desc';
        }

        this.productService.listProducts({
            page: this.page(),
            limit: this.limit(),
            search: this.searchTerm || undefined,
            sort: sort
        }).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    // Map backend snake_case to frontend camelCase for display
                    const products = response.data.products.map(p => ({
                        ...p,
                        imageUrl: p.image_url,
                        categoryName: p.category_name,
                        categoryId: p.category_id
                    })) as Product[];
                    this.products.set(products);
                    // Use total count from backend if provided, otherwise estimate
                    if (response.data.total !== undefined) {
                        this.total.set(response.data.total);
                    } else {
                        this.total.set(response.data.products.length);
                    }
                }
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading products:', error);
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
        if (this.productToDelete && this.productToDelete.id) {
            this.productService.deleteProduct(this.productToDelete.id.toString()).subscribe({
                next: (response) => {
                    if (response.success) {
                        this.toast.show('Product deleted successfully', 'success');
                        this.loadProducts(); // Refresh list
                    }
                    this.isDeleteModalOpen = false;
                    this.productToDelete = null;
                },
                error: (error) => {
                    console.error('Error deleting product:', error);
                    this.toast.show('Failed to delete product', 'error');
                    this.isDeleteModalOpen = false;
                }
            });
        }
    }
}
