import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth';
import { SessionStore } from '../../../core/services/session-store';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';

/** Mi perfil: identidad, roles y permisos efectivos de la sesión. */
@Component({
  host: { class: 'block' },
  selector: 'app-profile',
  imports: [ButtonModule, CardModule, MessageModule, PageHeader, StatusTag, TableModule, TagModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(MessageService);

  readonly session = inject(SessionStore);
  readonly refreshing = signal(false);

  refresh(): void {
    this.refreshing.set(true);
    this.auth.me().subscribe({
      next: () => {
        this.refreshing.set(false);
        this.notify.add({
          severity: 'success',
          summary: 'Sesión sincronizada',
          detail: 'Perfil y permisos recargados.',
        });
      },
      error: () => this.refreshing.set(false),
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.notify.add({ severity: 'info', summary: 'Sesión cerrada' });
        void this.router.navigate(['/login']);
      },
    });
  }
}
