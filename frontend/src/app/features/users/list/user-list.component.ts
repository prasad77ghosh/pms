import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { User } from '../../../core/models/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, TableComponent, RouterLink, ModalComponent],
  templateUrl: './user-list.component.html'
})
export class UserListComponent {
  userService = inject(UserService);
  router = inject(Router);
  toast = inject(ToastService);

  users = signal<User[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  isLoading = signal(false);

  isDeleteModalOpen = false;
  userToDelete: User | null = null;

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
  ];

  constructor() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);

    this.userService.listUsers({
      page: this.page(),
      limit: this.limit()
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users.set(response.data.data);
          this.total.set(response.data.total);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toast.show('Failed to load users', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.page.set(page);
    this.loadUsers();
  }

  onEdit(user: User) {
    this.router.navigate(['/users/edit', user.id]);
  }

  onDelete(user: User) {
    this.userToDelete = user;
    this.isDeleteModalOpen = true;
  }

  confirmDelete() {
    if (this.userToDelete && this.userToDelete.id) {
      this.userService.deleteUser(this.userToDelete.id.toString()).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.show('User deleted successfully', 'success');
            this.loadUsers();
          }
          this.isDeleteModalOpen = false;
          this.userToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.toast.show('Failed to delete user', 'error');
          this.isDeleteModalOpen = false;
        }
      });
    }
  }
}
