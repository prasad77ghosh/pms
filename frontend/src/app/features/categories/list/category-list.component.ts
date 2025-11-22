import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
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
  categoryService = inject(CategoryService);
  router = inject(Router);
  toast = inject(ToastService);

  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  isLoading = signal(false);

  isDeleteModalOpen = false;
  categoryToDelete: Category | null = null;

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
  ];

  constructor() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);

    this.categoryService.listCategories({
      page: this.page(),
      limit: this.limit()
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories.set(response.data.data);
          this.total.set(response.data.total);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toast.show('Failed to load categories', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadCategories();
  }

  onEdit(category: Category) {
    this.router.navigate(['/categories/edit', category.id]);
  }

  onDelete(category: Category) {
    this.categoryToDelete = category;
    this.isDeleteModalOpen = true;
  }

  confirmDelete() {
    if (this.categoryToDelete && this.categoryToDelete.id) {
      this.categoryService.deleteCategory(this.categoryToDelete.id.toString()).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.show('Category deleted successfully', 'success');
            this.loadCategories();
          }
          this.isDeleteModalOpen = false;
          this.categoryToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.toast.show('Failed to delete category', 'error');
          this.isDeleteModalOpen = false;
        }
      });
    }
  }
}
