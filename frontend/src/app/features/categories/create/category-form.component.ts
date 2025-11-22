import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  router = inject(Router);
  toast = inject(ToastService);

  categoryForm = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  isEditMode = false;
  isSubmitting = false;

  ngOnInit() {
    if (this.id) {
      this.isEditMode = true;
      // Mock Load
      this.categoryForm.patchValue({
        name: 'Electronics',
        description: 'Gadgets'
      });
    }
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.isSubmitting = true;
      setTimeout(() => {
        this.toast.show(this.isEditMode ? 'Category updated' : 'Category created', 'success');
        this.router.navigate(['/categories']);
      }, 500);
    }
  }
}
