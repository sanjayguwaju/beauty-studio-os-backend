import { Response } from 'express';
import { AuthRequest } from '../../types';
import { sendSuccess, sendError } from '../../utils/response';
import { Person } from '../../models/Person';
import { LoyaltyTransaction } from '../../models/LoyaltyTransaction';

export const getLoyaltyDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId || req.user!.tenantId;

    // 1. Get Top 10 Clients by Loyalty Points
    const leaderboard = await Person.find({ tenantId, loyaltyPoints: { $gt: 0 } })
      .sort({ loyaltyPoints: -1 })
      .limit(10)
      .select('fullName email phone loyaltyPoints');

    // 2. Get Recent Loyalty Transactions
    const recentTransactions = await LoyaltyTransaction.find({ tenantId })
      .populate('personId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(20);

    sendSuccess(res, { leaderboard, recentTransactions });
  } catch (error) {
    console.error("Loyalty Dashboard Error:", error);
    sendError(res, 500, 'Failed to fetch loyalty data');
  }
};
