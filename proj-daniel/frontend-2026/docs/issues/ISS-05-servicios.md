# ISS-05 · CRUD de servicios y relación con tipos de prenda — TextilClean

**Bloqueado por:** ISS-04. **Habilita:** ISS-06.

## Objetivo

Administrar los **servicios de lavandería** (lavado y secado, desinfección, planchado,
desmanchado, lavado en seco), cada uno ligado a un tipo de prenda y con su forma de cobro.

## Contrato con el backend

`/api/servicios` → `{ laundry_services }`; cada servicio trae `garment_type: { id, name }`.

| Campo | UI |
|---|---|
| `garment_type_id` | `p-select` con `optionValue="id"` (guarda el id, no el objeto) |
| `billing_unit` | `kg` = precio por kilogramo · `unit` = precio por prenda |
| `price` | `p-inputnumber` en COP; el DECIMAL que llega como string se convierte con `toNumber` |
| `estimated_hours` | Horas de entrega estimadas (el backend las usa para calcular la fecha de entrega de la orden) |

Errores de negocio del backend: tipo de prenda inexistente → 404; inactivo → 400.

## Componentes

- `LaundryServiceList`: `forkJoin` de servicios + tipos de prenda; filtros por texto **y** por tipo.
- `LaundryServiceForm`: validaciones de nombre, tipo, precio ≥ 0 y horas ≥ 1.
- `CopPipe` (`shared/pipes`): formato `$ 5.500` para todos los valores en pesos.

## Criterios de aceptación

- [x] Relación servicio → tipo de prenda en lista y formulario
- [x] Precio y unidad de cobro visibles (`$ 5.500 por kg`)
- [x] Pruebas de carga paralela, filtros y payload del formulario
