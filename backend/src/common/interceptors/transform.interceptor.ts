import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // Skip transformation if data is already in ApiResponseDto format
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data as ApiResponseDto<T>;
        }

        // Skip transformation for health checks and certain endpoints
        const request = context.switchToHttp().getRequest();
        const url = request.url;
        
        // Don't transform health check endpoints
        if (url.startsWith('/health')) {
          return data as any;
        }

        // Wrap response in standard format
        return new ApiResponseDto(data);
      }),
    );
  }
}
