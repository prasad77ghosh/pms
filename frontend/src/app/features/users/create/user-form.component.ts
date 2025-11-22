import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
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
  userService = inject(UserService);
  router = inject(Router);
  toast = inject(ToastService);

  userForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''], // Validation handled dynamically
    role: ['user' as 'admin' | 'user', Validators.required]
  });

  isEditMode = false;
  isSubmitting = false;

  ngOnInit() {
    if (this.id) {
      this.isEditMode = true;
      this.loadUser(this.id);
    }
  }

  loadUser(id: string) {
    this.userService.getUser(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.userForm.patchValue({
            name: response.data.name,
            email: response.data.email,
            role: response.data.role || 'user'
          });
        }
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.toast.show('Failed to load user', 'error');
        this.router.navigate(['/users']);
      }
    });
  }

  onSubmit() {
    // Add password validation if in create mode
    if (!this.isEditMode) {
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      this.userForm.get('password')?.clearValidators();
    }
    this.userForm.get('password')?.updateValueAndValidity();

    if (this.userForm.valid) {
      this.isSubmitting = true;
      const formData = this.userForm.value;

      if (this.isEditMode && this.id) {
        const userData = {
          name: formData.name!,
          email: formData.email!,
          role: formData.role!
        };

        // Update existing user
        this.userService.updateUser(this.id, userData).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.show('User updated successfully', 'success');
              this.router.navigate(['/users']);
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating user:', error);
            this.toast.show('Failed to update user', 'error');
            this.isSubmitting = false;
          }
        });
      } else {
        const userData = {
          name: formData.name!,
          email: formData.email!,
          password: formData.password!,
          role: formData.role!
        };

        // Create new user
        this.userService.createUser(userData).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.show('User created successfully', 'success');
              this.router.navigate(['/users']);
            }
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating user:', error);
            this.toast.show('Failed to create user', 'error');
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
