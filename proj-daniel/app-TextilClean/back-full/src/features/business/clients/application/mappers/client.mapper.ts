import { Client } from '../../domain/entities/client.entity.js';
import { CreateClientDto } from '../dto/create-client.dto.js';

export class ClientMapper {
  static toEntity(dto: CreateClientDto): Client {
    return new Client({
      name: dto.name,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      address: dto.address ?? null,
      status: 'active',
    });
  }

  static toResponse(client: Client) {
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      status: client.status,
    };
  }
}
