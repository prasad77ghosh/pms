import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
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
    api = inject(ApiService);
    router = inject(Router);
    toast = inject(ToastService);

    products = signal<Product[]>([]);
    total = signal(0);
    page = signal(1);
    limit = signal(10);

    searchTerm = '';
    searchSubject = new Subject<string>();

    sortKey = '';
    sortDir = '';

    isDeleteModalOpen = false;
    productToDelete: Product | null = null;

    columns: TableColumn[] = [
        { key: 'imageUrl', label: 'Image', type: 'image', sortable: false },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'categoryName', label: 'Category', sortable: true },
        { key: 'price', label: 'Price', type: 'currency', sortable: true },
        { key: 'stock', label: 'Stock', sortable: true },
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

    loadProducts() {
        // In a real app, we would call the API
        // this.api.getList<Product>('products', this.page(), this.limit(), this.sortKey ? `${this.sortKey}:${this.sortDir}` : undefined, this.searchTerm)
        //   .subscribe(res => {
        //     this.products.set(res.data);
        //     this.total.set(res.total);
        //   });

        // MOCK DATA
        const mockProducts: Product[] = Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            description: `Description for Product ${i + 1}`,
            price: (i + 1) * 100,
            categoryId: 1,
            categoryName: 'Electronics',
            stock: 50,
            imageUrl: `https://via.placeholder.com/150?text=Product+${i + 1}`
        }));

        // Filter and Sort Mock
        let filtered = mockProducts.filter(p => p.name.toLowerCase().includes(this.searchTerm.toLowerCase()));

        if (this.sortKey) {
            filtered.sort((a: any, b: any) => {
                if (a[this.sortKey] < b[this.sortKey]) return this.sortDir === 'asc' ? -1 : 1;
                if (a[this.sortKey] > b[this.sortKey]) return this.sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const start = (this.page() - 1) * this.limit();
        const paged = filtered.slice(start, start + this.limit());

        this.products.set(paged);
        this.total.set(filtered.length);
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
        if (this.productToDelete) {
            // this.api.delete(`products/${this.productToDelete.id}`).subscribe(...)
            this.toast.show('Product deleted successfully', 'success');
            this.loadProducts(); // Refresh list
            this.isDeleteModalOpen = false;
            this.productToDelete = null;
        }
    }
}
