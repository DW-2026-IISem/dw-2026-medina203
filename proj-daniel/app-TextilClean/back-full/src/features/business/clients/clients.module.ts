import { Module } from '@nestjs/common';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case.js';
import { GetClientByIdUseCase } from './application/use-cases/get-client-by-id.use-case.js';
import { ListClientsUseCase } from './application/use-cases/list-clients.use-case.js';
import { CLIENT_REPOSITORY } from './domain/interfaces/client.repository.js';
import { ClientRepository } from './infrastructure/persistence/repositories/client.repository.js';
import { ClientSeeder } from './infrastructure/persistence/seeders/client.seeder.js';
import { ClientsController } from './presentation/http/controllers/clients.controller.js';

@Module({
  controllers: [ClientsController],
  providers: [
    CreateClientUseCase,
    ListClientsUseCase,
    GetClientByIdUseCase,
    ClientSeeder,
    { provide: CLIENT_REPOSITORY, useClass: ClientRepository },
  ],
  exports: [CLIENT_REPOSITORY, ClientSeeder],
})
export class ClientsModule {}
