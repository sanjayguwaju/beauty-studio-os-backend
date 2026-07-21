import { Request, Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../../../types';
import { sendSuccess, sendError } from '../../../utils/response';
import { Conversation } from '../../../models/Conversation';
import { Message } from '../../../models/Message';
import { BotService } from '../../ai/bot.service';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'globalapikey';

/**
 * Create a new WhatsApp Instance for a tenant
 */
export const createInstance = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const instanceName = `tenant_${tenantId}`;

    const response = await axios.post(
      `${EVOLUTION_API_URL}/instance/create`,
      {
        instanceName,
        token: instanceName,
        qrcode: true,
      },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
      }
    );

    sendSuccess(res, 201, 'Instance created', response.data);
  } catch (error: any) {
    console.error('Error creating Evolution instance:', error.response?.data || error.message);
    sendError(res, 500, 'Failed to create WhatsApp instance');
  }
};

/**
 * Fetch QR Code for the instance
 */
export const getQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const instanceName = `tenant_${tenantId}`;

    const response = await axios.get(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: { apikey: EVOLUTION_API_KEY },
    });

    sendSuccess(res, 200, 'QR Code fetched', response.data);
  } catch (error: any) {
    sendError(res, 500, 'Failed to fetch QR Code');
  }
};

/**
 * Send a WhatsApp Message
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, id: userId } = req.user!;
    const { number, text, conversationId } = req.body;
    const instanceName = `tenant_${tenantId}`;

    // 1. Send via Evolution API
    const response = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        number,
        options: { delay: 1200, presence: 'composing' },
        textMessage: { text },
      },
      { headers: { apikey: EVOLUTION_API_KEY } }
    );

    // 2. Save to our local DB
    let activeConversation = await Conversation.findById(conversationId);
    if (!activeConversation) {
      activeConversation = await Conversation.create({
        tenantId,
        platform: 'whatsapp',
        platformIdentifier: number,
        status: 'open',
      });
    }

    const message = await Message.create({
      conversationId: activeConversation._id,
      direction: 'outbound',
      content: text,
      messageType: 'text',
      status: 'sent',
      sentBy: userId,
      externalId: response.data.key?.id,
    });

    activeConversation.lastMessageAt = new Date();
    activeConversation.lastMessagePreview = text.substring(0, 50);
    await activeConversation.save();

    sendSuccess(res, message, 'Message sent', 201);
  } catch (error: any) {
    console.error('Send message error:', error.response?.data || error.message);
    sendError(res, 500, 'Failed to send WhatsApp message');
  }
};

/**
 * Evolution API Webhook Receiver
 * Handles incoming messages from WhatsApp
 */
export const webhookHandler = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Example Evolution API payload structure check
    if (payload.event === 'messages.upsert') {
      const msg = payload.data.messages[0];
      if (!msg || msg.key.fromMe) return res.status(200).send('OK'); // Ignore outbound messages sent from phone

      const instanceName = payload.instance; // e.g. "tenant_12345"
      const tenantId = instanceName.replace('tenant_', '');
      const remoteJid = msg.key.remoteJid; // e.g. "5511999999999@s.whatsapp.net"
      const phoneNumber = remoteJid.split('@')[0];
      const textContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

      if (!textContent) return res.status(200).send('OK');

      // 1. Find or create conversation
      let conversation = await Conversation.findOne({ tenantId, platformIdentifier: phoneNumber, platform: 'whatsapp' });
      
      if (!conversation) {
        conversation = await Conversation.create({
          tenantId,
          platform: 'whatsapp',
          platformIdentifier: phoneNumber,
          status: 'open',
        });
      }

      // 2. Save incoming message
      await Message.create({
        conversationId: conversation._id,
        direction: 'inbound',
        content: textContent,
        messageType: 'text',
        status: 'received',
        externalId: msg.key.id,
      });

      // Update conversation metadata
      conversation.lastMessageAt = new Date();
      conversation.lastMessagePreview = textContent.substring(0, 50);
      conversation.status = 'open'; // Re-open if closed
      await conversation.save();

      // 3. AI Autopilot Logic
      if (conversation.botStatus === 'active') {
        const aiResponseText = await BotService.processMessage(
          conversation._id.toString(), 
          textContent, 
          phoneNumber
        );

        // Send AI response back to client via Evolution API
        const response = await axios.post(
          `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
          {
            number: phoneNumber,
            options: { delay: 1200, presence: 'composing' },
            textMessage: { text: aiResponseText },
          },
          { headers: { apikey: EVOLUTION_API_KEY } }
        );

        // Save AI response to DB
        await Message.create({
          conversationId: conversation._id,
          direction: 'outbound',
          content: aiResponseText,
          messageType: 'text',
          status: 'sent',
          externalId: response.data?.key?.id,
        });

        conversation.lastMessageAt = new Date();
        conversation.lastMessagePreview = aiResponseText.substring(0, 50);
        await conversation.save();
      }

      // (Optional) Emit Socket event here for real-time UI updates
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Toggle Bot Autopilot for a specific conversation
 */
export const toggleBotStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { conversationId } = req.params;
    const { botStatus } = req.body; // 'active' | 'paused'

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, tenantId },
      { botStatus },
      { new: true }
    );

    if (!conversation) return sendError(res, 404, 'Conversation not found');

    sendSuccess(res, conversation, 'Bot status updated');
  } catch (error) {
    sendError(res, 500, 'Failed to update bot status');
  }
};
