import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Category } from '../../../core/models/models';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, TableComponent, RouterLink, ModalComponent],
  templateUrl: './category-list.component.html'
})
export class CategoryListComponent {
  router = inject(Router);
  toast = inject(ToastService);

  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);

  isDeleteModalOpen = false;
  categoryToDelete: Category | null = null;

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
  ];

  constructor() {
    this.loadCategories();
  }

  loadCategories() {
    // Mock Data
    this.categories.set([
      { id: 1, name: 'Electronics', description: 'Gadgets and devices' },
      { id: 2, name: 'Clothing', description: 'Apparel and fashion' },
      { id: 3, name: 'Books', description: 'Fiction and non-fiction' }
    ]);
    this.total.set(3);
  }

  onPageChange(page: number) {
    this.page.set(page);
    // Reload data
  }

  onEdit(category: Category) {
    this.router.navigate(['/categories/edit', category.id]);
  }

  onDelete(category: Category) {
    this.categoryToDelete = category;
    this.isDeleteModalOpen = true;
  }

  confirmDelete() {
    this.toast.show('Category deleted', 'success');
    this.isDeleteModalOpen = false;
  }
}
