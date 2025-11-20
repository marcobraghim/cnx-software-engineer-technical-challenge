import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailserviceapiEntity } from './entities/emailserviceapi.entity';
import { MoreThan, Repository } from 'typeorm';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class SendEmailsService {
  private readonly baseUrl = process.env.EMAILSYSAPI_BASE_URL ?? '';

  private cachedToken: EmailserviceapiEntity | null = null;

  constructor(
    @InjectRepository(EmailserviceapiEntity)
    private readonly emailServiceApiRepository: Repository<EmailserviceapiEntity>,
  ) { }

  /**
   * This method is used to ensure that the email service token is valid
   * and if not, it will be refreshed and stored in the database
   *
   * @returns The valid email service token
   */
  async ensureValidEmailServiceToken() {
    // First, check if cached token is still valid
    if (this.cachedToken && this.cachedToken.expiration > new Date()) {
      return this.cachedToken;
    }

    // If cache is invalid or doesn't exist, check database
    const existingToken = await this.emailServiceApiRepository.findOne({
      where: { expiration: MoreThan(new Date()) },
    });

    if (existingToken) {
      // Update cache with token from database
      this.cachedToken = existingToken;
      return existingToken;
    }

    const username = process.env.EMAILSYSAPI_USERNAME;
    const password = process.env.EMAILSYSAPI_PASSWORD;

    if (!username || !password) {
      throw new InternalServerErrorException(
        'EMAILSYS_API_USERNAME and EMAILSYS_API_PASSWORD environment variables must be set',
      );
    }

    let response: Response;
    try {
      response = await fetch(this.baseUrl + '/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
    } catch (error) {
      throw new InternalServerErrorException(`Failed to reach email service auth endpoint: ${String(error)}`);
    }

    if (!response.ok) {
      const errorMessage = await response.text().catch(() => response.statusText);
      throw new InternalServerErrorException(
        `Failed to retrieve email service token: ${response.status} ${errorMessage}`,
      );
    }

    const payload = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    if (!payload?.access_token || !payload?.expires_in) {
      throw new InternalServerErrorException('Invalid token response from email service');
    }

    const expiration = new Date(Date.now() + payload.expires_in * 1000);
    const tokenRecord = this.emailServiceApiRepository.create({
      jwttoken: payload.access_token,
      expiration,
    });

    const savedToken = await this.emailServiceApiRepository.save(tokenRecord);
    
    // Update cache with newly created token
    this.cachedToken = savedToken;
    
    return savedToken;
  }

  async sendEmail(emailData: SendEmailDto) {
    const token = await this.ensureValidEmailServiceToken();

    let response: Response;
    try {
      console.log('Email body:', emailData.body);

      response = await fetch(this.baseUrl + '/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.jwttoken}`,
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
        }),
      });
    } catch (error) {
      throw new BadGatewayException(`Failed to reach email service: ${String(error)}`);
    }

    const statusCode = response.status;

    switch (statusCode) {
      case 200:
      case 202:
        return
      case 400:
        throw new BadRequestException('Invalid payload');

      case 401:
        throw new UnauthorizedException('Missing or invalid authentication token');

      case 429:
        throw new HttpException('Rate limit exceeded (too many requests)', HttpStatus.TOO_MANY_REQUESTS);

      case 500:
        throw new InternalServerErrorException('Internal server error');

      case 502:
        throw new BadGatewayException('Bad gateway (external service error)');

      case 503:
        throw new ServiceUnavailableException('Service unavailable (temporary maintenance)');

      default:
        const defaultError = await response.text().catch(() => response.statusText);
        throw new HttpException(`Unexpected error: ${statusCode} ${defaultError}`, statusCode);
    }
  }
}
