import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
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
  router = inject(Router);
  toast = inject(ToastService);

  users = signal<User[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);

  isDeleteModalOpen = false;
  userToDelete: User | null = null;

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', sortable: false }
  ];

  constructor() {
    this.loadUsers();
  }

  loadUsers() {
    // Mock Data
    this.users.set([
      { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      { id: 2, name: 'Regular User', email: 'user@example.com', role: 'user' }
    ]);
    this.total.set(2);
  }

  onPageChange(page: number) {
    this.page.set(page);
  }

  onEdit(user: User) {
    this.router.navigate(['/users/edit', user.id]);
  }

  onDelete(user: User) {
    this.userToDelete = user;
    this.isDeleteModalOpen = true;
  }

  confirmDelete() {
    this.toast.show('User deleted', 'success');
    this.isDeleteModalOpen = false;
  }
}
