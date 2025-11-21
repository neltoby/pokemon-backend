import { validate } from 'class-validator';

export class ValidationError extends Error {
  public readonly statusCode = 400;
  public readonly details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export async function validateDto<T extends object>(dto: T): Promise<void> {
  const errors = await validate(dto as any, {
    whitelist: true,
    forbidNonWhitelisted: true
  });

  if (!errors.length) return;

  const details: Record<string, string[]> = {};

  for (const err of errors) {
    const prop = err.property;
    const messages = err.constraints
      ? Object.values(err.constraints)
      : ['Invalid value'];

    details[prop] = messages;
  }

  const flatMessage = Object.entries(details)
    .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
    .join(' | ');

  throw new ValidationError(flatMessage, details);
}
