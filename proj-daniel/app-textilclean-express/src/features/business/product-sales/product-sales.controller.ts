import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import {
  CreateProductSaleDto,
  PatchProductSaleDto,
  UpdateProductSaleDto,
} from "./dto";
import { ProductSalesService } from "./product-sales.service";

export class ProductSalesController extends BaseController {
  public constructor(private readonly service: ProductSalesService = new ProductSalesService()) {
    super();
  }

  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ product_sales: await this.service.getAll() });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ product_sale: await this.service.getOne(this.paramId(req)) });
    });
  }

  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sale = await this.service.create(req.body as CreateProductSaleDto);
      res.status(201).json({ product_sale });
    });
  }

  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sale = await this.service.updatePut(
        this.paramId(req),
        req.body as UpdateProductSaleDto
      );
      res.status(200).json({ product_sale });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sale = await this.service.updatePatch(
        this.paramId(req),
        req.body as PatchProductSaleDto
      );
      res.status(200).json({ product_sale });
    });
  }

  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Product sale permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const product_sale = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Product sale deactivated", product_sale });
    });
  }
}