import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService) => {
        const level = cfg.get('LOG_LEVEL');
        const isProduction = cfg.isProduction;
        return {
          pinoHttp: {
            level,
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    singleLine: true,
                  },
                },
            genReqId: (req: IncomingMessage, res: ServerResponse) => {
              const existing = req.headers['x-request-id'];
              const id =
                typeof existing === 'string' && existing.length > 0
                  ? existing
                  : randomUUID();
              res.setHeader('x-request-id', id);
              return id;
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
              ],
              censor: '[redacted]',
            },
            customLogLevel: (_req, res, err) => {
              if (err || res.statusCode >= 500) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
          },
        };
      },
    }),
  ],
})
export class LoggingModule {}
