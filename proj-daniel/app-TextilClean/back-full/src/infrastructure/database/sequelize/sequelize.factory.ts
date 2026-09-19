import { Sequelize } from 'sequelize-typescript';
import { getDbBlock } from '../../../config/environment/db-env.js';
import { IEnvConfig } from '../../../config/environment/env.interface.js';
import { ClientModel } from '../../../features/business/clients/infrastructure/persistence/models/client.model.js';
import { ProductTypeModel } from '../../../features/business/product-types/infrastructure/persistence/models/product-type.model.js';
import { ProductModel } from '../../../features/business/products/infrastructure/persistence/models/product.model.js';
import { ProductSaleModel } from '../../../features/business/sales/infrastructure/persistence/models/product-sale.model.js';
import { SaleModel } from '../../../features/business/sales/infrastructure/persistence/models/sale.model.js';

export const ALL_MODELS: any[] = [
  ClientModel,
  ProductTypeModel,
  ProductModel,
  SaleModel,
  ProductSaleModel,
];

export function sequelizeFactory(cfg: IEnvConfig): Sequelize {
  const block = getDbBlock(cfg);
  const options: Record<string, unknown> = {
    dialect: cfg.dbDialect,
    host: block.host,
    port: block.port,
    username: block.username,
    password: block.password,
    database: block.name,
    models: ALL_MODELS,
    logging: false,
  };
  if (cfg.dbDialect === 'oracle' && block.connectString) {
    options.connectString = block.connectString;
  }
  return new Sequelize(options);
}
