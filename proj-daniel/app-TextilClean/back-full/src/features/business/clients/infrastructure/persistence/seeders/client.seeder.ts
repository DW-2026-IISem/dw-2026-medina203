import { Inject, Injectable, Logger } from "@nestjs/common";
import { Client } from '../../../domain/entities/client.entity.js';
import { CLIENT_REPOSITORY } from '../../../domain/interfaces/client.repository.js';
import type { IClientRepository } from '../../../domain/interfaces/client.repository.js';

@Injectable()
export class ClientSeeder {
  private readonly logger = new Logger(ClientSeeder.name);

  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clientRepository: IClientRepository,
  ) {}

  async seed(): Promise<void> {
    const email = 'demo.cliente@tecnogua.edu.co';
    const existing = await this.clientRepository.findByEmail(email);
    if (existing) {
      this.logger.log('Seeder clients: ya existía el cliente demo (idempotente)');
      return;
    }
    await this.clientRepository.create(
      new Client({
        name: 'Cliente Demo',
        email,
        phone: '3001234567',
        address: 'Riohacha, La Guajira',
        status: 'active',
      }),
    );
    this.logger.log('Seeder clients: cliente demo creado');
  }
}
