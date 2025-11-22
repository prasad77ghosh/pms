import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './category-form.component.html'
})
export class CategoryFormComponent implements OnInit {
  @Input() id?: string;

  fb = inject(FormBuilder);
  categoryService = inject(CategoryService);
  router = inject(Router);
  toast = inject(ToastService);

  categoryForm = this.fb.group({
    name: ['', Validators.required]
  });

  isEditMode = false;
  isSubmitting = false;

  ngOnInit() {
    if (this.id) {
      this.isEditMode = true;
      this.loadCategory(this.id);
    }
  }

  loadCategory(id: string) {
    this.categoryService.getCategory(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categoryForm.patchValue({
            name: response.data.name
          });
        }
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.toast.show('Failed to load category', 'error');
        this.router.navigate(['/categories']);
      }
    });
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.isSubmitting = true;
      const formData = this.categoryForm.value;

      const categoryData = {
        name: formData.name!
      };

      if (this.isEditMode && this.id) {
        // Update existing category
        this.categoryService.updateCategory(this.id, categoryData).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.show('Category updated successfully', 'success');
              this.router.navigate(['/categories']);
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating category:', error);
            this.toast.show('Failed to update category', 'error');
            this.isSubmitting = false;
          }
        });
      } else {
        // Create new category
        this.categoryService.createCategory(categoryData).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.show('Category created successfully', 'success');
              this.router.navigate(['/categories']);
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating category:', error);
            this.toast.show('Failed to create category', 'error');
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.categoryForm.markAllAsTouched();
    }
  }
}
