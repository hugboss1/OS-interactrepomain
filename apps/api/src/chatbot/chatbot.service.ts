import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

const FAQ_KNOWLEDGE_BASE = `
# RippledApp FAQ Knowledge Base

## Concept & Innovation

**What is RippledApp and what makes it innovative?**
RippledApp is a next-generation crowdfunding platform that fuses generative AI, predictive AI, and blockchain. Unlike traditional models, RippledApp charges **zero commission on collected funds**, monetizing through AI services and a gamified internal economy.

**How does AI help project creators?**
AI acts as a true "Marketing Director." It automatically generates texts, illustrations, and professional videos for each campaign. It also provides advanced data analytics and strategic recommendations to maximize social engagement.

**How does the AI project scoring work?**
The system uses two main indices:
- **IAV (Speed Acceleration Index)**: measures contribution dynamics and social media engagement in real time
- **IPS (Social Performance Index)**: analyzes social network impact

These two indices combine into the **IGD (Global Dynamic Index)**, a score out of 10 that serves as a compass for investors. The algorithm uses social data as new evidence to revise the initial probability of success.

## Gencoin & Blockchain

**What is Gencoin?**
Gencoin is a utility token (ERC-20 on Polygon) used to bet on campaign success or failure. Bets are managed by transparent smart contracts. **97% of stakes are redistributed to winners**, with the remaining 3% covering platform fees and token burning.

**Why burn Gencoins during bets?**
This "burn" mechanism controls monetary supply inflation. By destroying a fraction of tokens per transaction (0.1% of the total stake), the platform ensures the long-term scarcity and economic sustainability of Gencoin. The more activity increases, the more the stabilization mechanism activates.

**What are the advantages of Gencoins compared to euros?**
While euros ensure the financial security of invested capital (via escrow), Gencoin offers:
- **Community prediction**: bet on project success and earn rewards
- **Massive redistribution**: 97% of stakes redistributed to winners (vs. lost bank fees)
- **Premium AI access**: predictive analytics tools, A/B testing, AI copilot
- **Genpoints generation**: non-transferable reputation points for rankings
- **Deflationary mechanism**: burn that rewards long-term holders

## Platform Users

**Who are the Rescuers?**
A Rescuer is an altruistic user profile who helps struggling projects detected by AI. In exchange for quick support to relaunch an initiative, they receive **bonus Genpoints** and may benefit from **partial cashback**.

**How do associations benefit from the platform?**
Associations benefit from augmented storytelling tools to create impactful mobilization campaigns and attract more donors through AI-generated visual and narrative content. Blockchain ensures total transparency on fund usage, strengthening donor credibility and loyalty.

## Pricing

**How are AI credits charged?**

One-time packs:
- Conception Pack: 9.90 EUR for 200 credits
- Launch Pack: 24.90 EUR for 600 credits (+ free generated video)

Subscriptions:
- 7.90 EUR/month for 250 credits
- 14.90 EUR/month for 600 credits
- Premium Plans (29 to 199 EUR/month): detailed predictive scoring (IAV/IPS), advanced analytics, AI copilot

## Security & Transparency

**How are my funds secured?**
All collected assets are deposited in an **escrow account controlled by a dedicated smart contract**. Funds remain locked until the end of the campaign and are only released to the project creator if success conditions are met. In case of failure, contributors are automatically refunded.

**Is RippledApp regulated?**
The platform complies with international KYC/AML standards (identity verification for all users) and uses oracles to validate on-chain transactions. Total transparency is ensured by the Polygon blockchain, where every transaction is publicly verifiable.

**Why patent the scoring algorithm?**
Patenting the Bayesian scoring algorithm creates a lasting technological barrier, ensuring RippledApp remains the only platform to offer such predictive transparency, which adds value to the company and secures investors.
`;

const SYSTEM_PROMPT = `You are the RippledApp customer support chatbot. You help visitors to the RippledApp landing page by answering their questions about the platform.

RULES:
- Always respond in English, regardless of the language of the question.
- Base your answers strictly on the FAQ knowledge base below. Do not invent information.
- Keep responses concise and friendly — maximum 3 sentences.
- If a question is not covered by the FAQ, politely say you don't have that information and suggest visiting the website or contacting support.

${FAQ_KNOWLEDGE_BASE}`;

@Injectable()
export class ChatbotService {
  private client: Anthropic;

  constructor(private configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async getReply(message: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    });

    const block = response.content[0];
    if (block.type === 'text') {
      return block.text;
    }
    return 'Sorry, I could not generate a response. Please try again.';
  }
}
