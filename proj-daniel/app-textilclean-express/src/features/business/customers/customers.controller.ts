import { Request, Response } from "express";
import { BaseController } from "../../../shared/http/base-controller";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto, PatchCustomerDto, UpdateCustomerDto } from "./dto";

/** Controller de Customers: solo HTTP (lee req, llama al service, arma res). */
export class CustomersController extends BaseController {
  public constructor(private readonly service: CustomersService = new CustomersService()) {
    super();
  }

  // ================== READ ==================
  public async getAll(_req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ customers: await this.service.getAll() });
    });
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      res.status(200).json({ customer: await this.service.getOne(this.paramId(req)) });
    });
  }

  // ================== CREATE ==================
  public async create(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const customer = await this.service.create(req.body as CreateCustomerDto);
      res.status(201).json({ customer });
    });
  }

  // ================== UPDATE ==================
  public async updatePut(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const customer = await this.service.updatePut(this.paramId(req), req.body as UpdateCustomerDto);
      res.status(200).json({ customer });
    });
  }

  public async updatePatch(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const customer = await this.service.updatePatch(this.paramId(req), req.body as PatchCustomerDto);
      res.status(200).json({ customer });
    });
  }

  // ================== DELETE ==================
  public async deletePhysical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const id = this.paramId(req);
      await this.service.deletePhysical(id);
      res.status(200).json({ message: "Customer permanently deleted", id });
    });
  }

  public async deleteLogical(req: Request, res: Response): Promise<void> {
    await this.run(res, async () => {
      const customer = await this.service.deleteLogical(this.paramId(req));
      res.status(200).json({ message: "Customer deactivated (logical delete)", customer });
    });
  }
}
