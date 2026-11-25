import { HttpMethod } from '../models/resource.model';

/** Severidad del `p-tag` según el método HTTP. */
export function methodSeverity(
  method: HttpMethod | undefined,
): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
  switch (method) {
    case 'GET':
      return 'info';
    case 'POST':
      return 'success';
    case 'PUT':
    case 'PATCH':
      return 'warn';
    case 'DELETE':
      return 'danger';
    default:
      return 'secondary';
  }
}

export const HTTP_METHODS: Array<{ label: string; value: HttpMethod }> = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
];
