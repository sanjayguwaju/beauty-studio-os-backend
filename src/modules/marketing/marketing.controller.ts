import { Response } from 'express';
import { AuthRequest } from '../../types';
import { sendSuccess, sendError } from '../../utils/response';
import { Campaign } from '../../models/Campaign';
import { Person } from '../../models/Person';
import axios from 'axios';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'globalapikey';

export const listCampaigns = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId || req.user!.tenantId;
    const campaigns = await Campaign.find({ tenantId }).sort({ createdAt: -1 });
    sendSuccess(res, campaigns);
  } catch (error) {
    sendError(res, 500, 'Failed to list campaigns');
  }
};

export const createAndSendCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId || req.user!.tenantId;
    const { name, targetAudience, messageTemplate } = req.body;

    // 1. Create the Campaign record in Draft mode
    const campaign = await Campaign.create({
      tenantId,
      name,
      targetAudience,
      messageTemplate,
      status: 'sending'
    });

    // 2. Fetch target audience from CRM
    let query: any = { tenantId };
    
    if (targetAudience === 'inactive_clients') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      query.createdAt = { $lte: threeMonthsAgo };
    }

    const targets = await Person.find(query);
    
    campaign.totalTarget = targets.length;
    await campaign.save();

    // 3. Execute WhatsApp Blast async (fire and forget for MVP)
    // Normally we'd use a message queue like BullMQ here to prevent request timeouts
    (async () => {
      let sentCount = 0;
      // Define your Evolution instance name (in real app, fetch from Tenant settings)
      const instanceName = 'BeautyStudio1';

      for (const target of targets) {
        if (!target.phone) continue;

        try {
          // Replace variables
          const personalizedMessage = messageTemplate
            .replace(/\{\{name\}\}/g, target.fullName)
            .replace(/\{\{lastName\}\}/g, ''); // Not applicable since we use fullName

          // Format phone number to Evolution API requirements (e.g. 5511999999999)
          const formattedPhone = target.phone.replace(/[^0-9]/g, '');

          await axios.post(
            `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
            {
              number: formattedPhone,
              options: { delay: 1500, presence: 'composing' },
              textMessage: { text: personalizedMessage },
            },
            { headers: { apikey: EVOLUTION_API_KEY } }
          );

          sentCount++;
        } catch (e) {
          console.error(`Failed to send to ${target.phone}`, e);
        }
      }

      campaign.sentCount = sentCount;
      campaign.status = 'completed';
      await campaign.save();
    })();

    // Respond immediately while blast runs in background
    sendSuccess(res, campaign, 'Campaign created and is now sending', 201);
  } catch (error) {
    console.error("Campaign Creation Error:", error);
    sendError(res, 500, 'Failed to create campaign');
  }
};
