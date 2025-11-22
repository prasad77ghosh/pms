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
    if (this.userForm.valid) {
      this.isSubmitting = true;
      const formData = this.userForm.value;

      const userData = {
        name: formData.name!,
        email: formData.email!,
        role: formData.role!
      };

      if (this.isEditMode && this.id) {
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
        // Note: User creation is handled by auth/register endpoint
        this.toast.show('Please use the registration page to create new users', 'info');
        this.router.navigate(['/auth/register']);
        this.isSubmitting = false;
      }
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
