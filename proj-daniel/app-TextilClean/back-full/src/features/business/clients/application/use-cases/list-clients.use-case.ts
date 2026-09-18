import { Inject, Injectable } from '@nestjs/common';
import { CLIENT_REPOSITORY } from '../../domain/interfaces/client.repository.js';
import type { IClientRepository } from '../../domain/interfaces/client.repository.js';
import { ClientMapper } from '../mappers/client.mapper.js';

@Injectable()
export class ListClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clientRepository: IClientRepository,
  ) {}

  async execute(page: number, limit: number) {
    const { items, total } = await this.clientRepository.findAll(page, limit);
    return {
      items: items.map(ClientMapper.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
