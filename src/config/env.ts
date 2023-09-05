import { TypeOf, object, string } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = object({
  DATABASE_URL: string().nonempty(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string().nonempty(),
  CLERK_SECRET_KEY: string().nonempty(),
});

type ParsedEnv = TypeOf<typeof envSchema>;

const parsedEnv = envSchema.parse(process.env);

export { type ParsedEnv, parsedEnv };
