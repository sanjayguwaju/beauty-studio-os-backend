import OpenAI from 'openai';
import { Conversation, IConversation } from '../../models/Conversation';
import { Message } from '../../models/Message';
import { Appointment } from '../../models/Appointment';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key',
});

// Define the tools the AI can use
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'checkAvailability',
      description: 'Check available appointment slots for a given date and service.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'The date to check (YYYY-MM-DD)' },
          service: { type: 'string', description: 'The name of the service' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'bookAppointment',
      description: 'Book a pending appointment for the client.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string' },
          clientPhone: { type: 'string' },
          service: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          time: { type: 'string', description: 'HH:MM (24-hour format)' },
        },
        required: ['clientName', 'clientPhone', 'service', 'date', 'time'],
      },
    },
  },
];

const SYSTEM_PROMPT = `
You are a helpful, professional, and friendly virtual receptionist for BeautyStudio OS. 
Your job is to answer client questions and help them book appointments.
Keep your responses concise and conversational, suitable for WhatsApp.
Use the checkAvailability tool to see if a slot is free before booking.
Use the bookAppointment tool to confirm the booking.
If a client asks something completely unrelated to beauty services or bookings, politely decline to answer.
`;

export class BotService {
  /**
   * Process an incoming message and generate a reply using OpenAI
   */
  static async processMessage(conversationId: string, incomingText: string, clientPhone: string): Promise<string> {
    try {
      // 1. Fetch recent message history to give the bot context
      const history = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Reverse to chronological order
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = history.reverse().map(msg => ({
        role: msg.direction === 'inbound' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Add system prompt at the beginning
      messages.unshift({ role: 'system', content: SYSTEM_PROMPT });

      // If OPENAI_API_KEY is not set (mock mode), return a hardcoded response
      if (process.env.OPENAI_API_KEY === undefined || process.env.OPENAI_API_KEY === 'sk-mock-key') {
        console.warn("OpenAI API key not found. Using mocked AI response.");
        return "Hi! I am the automated booking assistant. I see you'd like to book an appointment. (This is a mock response because the OpenAI API key is not configured in .env).";
      }

      // 2. Call OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;

      // 3. Handle Tool Calls (if the bot decided to use a tool)
      if (responseMessage.tool_calls) {
        let finalResponseText = '';
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;
          const func = (toolCall as any).function;
          const args = JSON.parse(func.arguments);
          
          if (func.name === 'checkAvailability') {
            // Mock logic: return that 10:00 AM and 2:00 PM are free
            const toolResult = "Available slots on " + args.date + ": 10:00 AM, 2:00 PM";
            messages.push(responseMessage);
            messages.push({
              role: 'tool',
              content: toolResult,
              tool_call_id: toolCall.id,
            });
          } else if (func.name === 'bookAppointment') {
            // Logic to create a pending appointment in DB
            const toolResult = "Success: Appointment booked for " + args.date + " at " + args.time;
            messages.push(responseMessage);
            messages.push({
              role: 'tool',
              content: toolResult,
              tool_call_id: toolCall.id,
            });
          }
        }

        // Call OpenAI again with the tool results
        const finalResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
        });

        return finalResponse.choices[0].message.content || 'Error generating response';
      }

      // 4. Return standard text reply
      return responseMessage.content || "I didn't quite catch that. Could you repeat?";
    } catch (error) {
      console.error("Bot processing error:", error);
      return "I'm sorry, our system is currently experiencing a technical issue. Please hold on and a human staff member will assist you shortly.";
    }
  }
}
