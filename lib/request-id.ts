import { headers } from 'next/headers';

export async function getRequestId() {
  const h = await headers();
  return h.get('x-request-id');
}
