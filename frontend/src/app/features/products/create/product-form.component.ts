import {
  Component,
  inject,
  Input,
  OnInit,
  signal
} from '@angular/core';

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
  @Input() id?: string;

  fb = inject(FormBuilder);
  productService = inject(ProductService);
  categoryService = inject(CategoryService);
  router = inject(Router);
  toast = inject(ToastService);

  /** FIXED: must match HTML */
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
      error: () => {
        this.toast.show('Failed to load categories', 'error');
      }
    });
  }

  loadProduct(id: string) {
    this.productService.getProduct(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const p = response.data;

          this.productForm.patchValue({
            name: p.name,
            price: p.price,
            category_id: p.category_id?.toString() ?? '',
            image_url: p.image_url ?? ''
          });

          if (p.image_url) {
            this.imagePreview.set(p.image_url);
          }
        }
      },
      error: () => {
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
        const url = reader.result as string;
        this.imagePreview.set(url);
        this.productForm.patchValue({ image_url: url });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    /** FIX — Convert null → undefined so TS matches backend types */
    const raw = this.productForm.value;

    const data:any = {
      name: raw.name ?? undefined,
      price: raw.price ?? undefined,
      category_id: raw.category_id ?? undefined,
      image_url: raw.image_url ?? undefined
    };

    if (this.isEditMode && this.id) {
      this.productService.updateProduct(this.id, data).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.show('Product updated successfully', 'success');
            this.router.navigate(['/products']);
          }
          this.isSubmitting = false;
        },
        error: () => {
          this.toast.show('Failed to update product', 'error');
          this.isSubmitting = false;
        }
      });
    } else {
      this.productService.createProduct(data).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.show('Product created successfully', 'success');
            this.router.navigate(['/products']);
          }
          this.isSubmitting = false;
        },
        error: () => {
          this.toast.show('Failed to create product', 'error');
          this.isSubmitting = false;
        }
      });
    }
  }
}
