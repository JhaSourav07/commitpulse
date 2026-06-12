import { describe, it, expect, expectTypeOf } from 'vitest';
import { INotification, Notification } from './Notification';

describe('Notification.ts - TypeScript Compiler Validation & Schema Constraints Stability', () => {
  it('Import the interfaces, types, or validation schemas associated with the file.', () => {
    // 1st condition: Ensure types and schemas are importable
    expect(Notification).toBeDefined();
    // Simply asserting that the exported mongoose Model exists and is a valid constructor
    expect(typeof Notification).toBe('function');
  });

  it('Use type-testing assertions (expectTypeOf) to enforce field property configurations.', () => {
    // 2nd condition: Enforce field properties via vitest's expectTypeOf
    // This is largely a compile-time check but works in vitest runners natively.
    expectTypeOf<INotification>().toHaveProperty('username').toBeString();
    expectTypeOf<INotification>().toHaveProperty('email').toBeString();
    expectTypeOf<INotification>().toHaveProperty('notifyOnCommit').toBeBoolean();
    expectTypeOf<INotification>().toHaveProperty('createdAt').toEqualTypeOf<Date>();
  });

  it('Assert that invalid prop parameters are blocked during static type checking.', () => {
    // 3rd condition: Block invalid props (runtime mongoose schematic equivalent verification)
    const invalidDoc = new Notification({
      username: 'testuser',
      // Intentionally omitting required 'email'
    });

    // Mongoose synchronusly validates and returns an error for invalid constraints
    const validationError = invalidDoc.validateSync();
    expect(validationError).toBeDefined();
    expect(validationError!.errors.email.name).toBe('ValidatorError');
    expect(validationError!.errors.email.kind).toBe('required');
  });

  it('Verify custom types accept optional values without compile errors.', () => {
    // 4th condition: Verify standard TS partiality/optional values
    // Using TS standard utility types to confirm flexible compatibility
    type OptionalNotification = Partial<INotification>;

    // Testing object declaration won't fail static compile
    const strictlyPartialData: OptionalNotification = {
      email: 'partial@example.com',
    };

    expectTypeOf(strictlyPartialData).toMatchTypeOf<Partial<INotification>>();
    expect(strictlyPartialData.email).toBe('partial@example.com');
    expect(strictlyPartialData.username).toBeUndefined(); // strictly isolated optional value
  });

  it('Verify schema validation constraints return strict validation reports.', () => {
    // 5th condition: Schema constraints returning strict reporting objects
    const docWithInvalidEnum = new Notification({
      username: 'test',
      email: 'test@example.com',
      frequency: 'not-a-valid-frequency', // Must be 'realtime' | 'daily' | 'weekly'
    });

    const errorReport = docWithInvalidEnum.validateSync();
    expect(errorReport).toBeDefined();
    expect(errorReport!.errors.frequency).toBeDefined();
    expect(errorReport!.errors.frequency.kind).toBe('enum');
  });
});
