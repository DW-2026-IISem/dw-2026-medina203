import { Client } from '../entities/client.entity.js';

export const CLIENT_REPOSITORY = 'IClientRepository';

export interface IClientRepository {
  create(client: Client): Promise<Client>;
  findAll(page: number, limit: number): Promise<{ items: Client[]; total: number }>;
  findById(id: number): Promise<Client | null>;
  findByEmail(email: string): Promise<Client | null>;
  count(): Promise<number>;
}
