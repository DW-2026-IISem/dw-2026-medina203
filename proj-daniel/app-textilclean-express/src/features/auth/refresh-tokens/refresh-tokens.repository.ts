import { CreationAttributes, Op, Transaction } from "sequelize";
import { RefreshToken } from "./refresh-token.model";

export class RefreshTokensRepository {
  public findByHash(tokenHash: string, transaction?: Transaction, lock = false): Promise<RefreshToken | null> {
    return RefreshToken.findOne({
      where: { token_hash: tokenHash },
      transaction,
      ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
  }
  public findAllByUser(userId: number, onlyActive = true): Promise<RefreshToken[]> {
    const where: { user_id: number; status?: "active" } = { user_id: userId };
    if (onlyActive) where.status = "active";
    return RefreshToken.findAll({ where, order: [["createdAt", "DESC"]] });
  }
  public findById(id: number): Promise<RefreshToken | null> {
    return RefreshToken.findByPk(id);
  }
  public create(data: CreationAttributes<RefreshToken>, transaction?: Transaction): Promise<RefreshToken> {
    return RefreshToken.create(data, { transaction });
  }
  public update(token: RefreshToken, data: Partial<RefreshToken>, transaction?: Transaction): Promise<RefreshToken> {
    return token.update(data, { transaction });
  }
  public async revokeFamily(familyId: string, transaction?: Transaction): Promise<number> {
    const [updated] = await RefreshToken.update(
      { status: "inactive" },
      { where: { family_id: familyId, status: "active" }, transaction }
    );
    return updated;
  }
  public async revokeAllByUser(userId: number): Promise<number> {
    const [updated] = await RefreshToken.update({ status: "inactive" }, { where: { user_id: userId, status: "active" } });
    return updated;
  }
  public purgeInactiveByUser(userId: number): Promise<number> {
    return RefreshToken.destroy({
      where: { user_id: userId, [Op.or]: [{ status: "inactive" }, { expires_at: { [Op.lt]: new Date() } }] },
    });
  }
  public countActiveByUser(userId: number): Promise<number> {
    return RefreshToken.count({ where: { user_id: userId, status: "active" } });
  }
}