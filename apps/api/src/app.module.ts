import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { PledgesModule } from './pledges/pledges.module';
import { PaymentsModule } from './payments/payments.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { EmailsModule } from './emails/emails.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmailsModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    PledgesModule,
    PaymentsModule,
    WaitlistModule,
    ChatbotModule,
  ],
})
export class AppModule {}
