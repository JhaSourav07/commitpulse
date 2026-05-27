import { z } from 'zod';

// This is your rulebook (Schema)
export const registrationSchema = z.object({
  // 1. Name Rule: Must be at least 3 characters, and spaces at the start/end are deleted.
  name: z.string().trim().min(3, { message: 'Name must be at least 3 characters long.' }),

  // 2. Email Rule: Must look like a real email format (e.g., user@domain.com).
  email: z.string().trim().email({ message: 'Invalid email format.' }),

  // 3. Password Rule: Must be at least 8 characters AND hit 3 specific patterns.
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Must include at least one uppercase letter.' })
    .regex(/[0-9]/, { message: 'Must include at least one number.' })
    .regex(/[^A-Za-z0-9]/, { message: 'Must include at least one special character.' }),
});
