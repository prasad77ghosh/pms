import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'image' | 'actions';
  sortable?: boolean;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html'
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() total: number = 0;
  @Input() page: number = 1;
  @Input() limit: number = 10;

  @Output() sort = new EventEmitter<{ key: string, direction: 'asc' | 'desc' }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  sortKey: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  onSort(col: TableColumn) {
    if (!col.sortable) return;

    if (this.sortKey === col.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = col.key;
      this.sortDirection = 'asc';
    }

    this.sort.emit({ key: this.sortKey, direction: this.sortDirection });
  }

  onPageChange(newPage: number) {
    if (newPage >= 1 && (newPage - 1) * this.limit < this.total) {
      this.pageChange.emit(newPage);
    }
  }

  onEdit(row: any) {
    this.edit.emit(row);
  }

  onDelete(row: any) {
    this.delete.emit(row);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
