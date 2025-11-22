import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html'
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmation';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() showFooter = true;

  @Output() closeEvent = new EventEmitter<void>();
  @Output() confirmEvent = new EventEmitter<void>();

  close() {
    this.closeEvent.emit();
  }

  confirm() {
    this.confirmEvent.emit();
  }
}
