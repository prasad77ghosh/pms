import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
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
  api = inject(ApiService);
  router = inject(Router);
  toast = inject(ToastService);

  productForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
    imageUrl: ['']
  });

  isEditMode = false;
  isSubmitting = false;
  imagePreview = signal<string | null>(null);
  categories = signal<Category[]>([]);

  ngOnInit() {
    // Load Categories (Mock)
    this.categories.set([
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Clothing' },
      { id: 3, name: 'Books' }
    ]);

    if (this.id) {
      this.isEditMode = true;
      this.loadProduct(this.id);
    }
  }

  loadProduct(id: string) {
    // Mock Load
    // this.api.get<Product>(`products/${id}`).subscribe(...)

    // Mock Data
    this.productForm.patchValue({
      name: 'Product ' + id,
      description: 'Description...',
      price: 100,
      categoryId: '1',
      stock: 50,
      imageUrl: 'https://via.placeholder.com/150'
    });
    this.imagePreview.set('https://via.placeholder.com/150');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result as string);
        // In real app, upload file or set to form
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.isSubmitting = true;
      // Mock Save
      setTimeout(() => {
        this.toast.show(this.isEditMode ? 'Product updated' : 'Product created', 'success');
        this.router.navigate(['/products']);
      }, 1000);
    } else {
      this.productForm.markAllAsTouched();
    }
  }
}
