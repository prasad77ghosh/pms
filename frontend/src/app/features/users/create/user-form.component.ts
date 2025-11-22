import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit {
  @Input() id?: string;

  fb = inject(FormBuilder);
  router = inject(Router);
  toast = inject(ToastService);

  userForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['user', Validators.required],
    password: ['']
  });

  isEditMode = false;
  isSubmitting = false;

  ngOnInit() {
    if (this.id) {
      this.isEditMode = true;
      this.userForm.get('password')?.removeValidators(Validators.required);
      // Mock Load
      this.userForm.patchValue({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      });
    } else {
      this.userForm.get('password')?.addValidators([Validators.required, Validators.minLength(6)]);
    }
    this.userForm.get('password')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      setTimeout(() => {
        this.toast.show(this.isEditMode ? 'User updated' : 'User created', 'success');
        this.router.navigate(['/users']);
      }, 500);
    }
  }
}
