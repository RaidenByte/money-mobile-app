import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

const statusCodeMap: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = statusCodeMap[status];
    let message = '服务器开小差了，请稍后重试';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = statusCodeMap[status] ?? 'HTTP_ERROR';

      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse) {
        const payload = errorResponse as {
          message?: string | string[];
          code?: string;
        };

        if (Array.isArray(payload.message)) {
          errors = payload.message;
          message = payload.message[0] ?? message;
        } else if (typeof payload.message === 'string') {
          message = payload.message;
        }

        if (payload.code) {
          code = payload.code;
        }
      }
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
