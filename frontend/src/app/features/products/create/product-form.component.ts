import { Component, inject, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { Category } from '../../../core/models/models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  @Input() id?: string; // From Router Input Binding

  fb = inject(FormBuilder);
  productService = inject(ProductService);
  categoryService = inject(CategoryService);
  router = inject(Router);
  toast = inject(ToastService);

  productForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    category_id: ['', Validators.required],
    image_url: ['']
  });

  isEditMode = false;
  isSubmitting = false;
  imagePreview = signal<string | null>(null);
  categories = signal<Category[]>([]);

  ngOnInit() {
    // Load Categories from backend
    this.loadCategories();

    if (this.id) {
      this.isEditMode = true;
      this.loadProduct(this.id);
    }
  }

  loadCategories() {
    this.categoryService.listCategories({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories.set(response.data.data);
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toast.show('Failed to load categories', 'error');
      }
    });
  }

  loadProduct(id: string) {
    this.productService.getProduct(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const product = response.data;
          this.productForm.patchValue({
            name: product.name,
            price: product.price,
            category_id: product.category_id?.toString() || '',
            image_url: product.image_url || ''
          });
          if (product.image_url) {
            this.imagePreview.set(product.image_url);
          }
        }
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.toast.show('Failed to load product', 'error');
        this.router.navigate(['/products']);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result as string);
        // In real app, upload file to server and get URL
        // For now, just set the data URL
        this.productForm.patchValue({ image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.isSubmitting = true;
      const formData = this.productForm.value;

      const productData = {
        name: formData.name!,
        price: formData.price!,
        category_id: formData.category_id!,
        image_url: formData.image_url || undefined
      };

      if (this.isEditMode && this.id) {
        // Update existing product
        this.productService.updateProduct(this.id, productData).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.show('Product updated successfully', 'success');
              this.router.navigate(['/products']);
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating product:', error);
            this.toast.show('Failed to update product', 'error');
            this.isSubmitting = false;
          }
        });
      } else {
        // Create new product
        this.productService.createProduct(productData).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.show('Product created successfully', 'success');
              this.router.navigate(['/products']);
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating product:', error);
            this.toast.show('Failed to create product', 'error');
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.productForm.markAllAsTouched();
    }
  }
}
