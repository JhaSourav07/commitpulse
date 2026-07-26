import { Copy, Zap, Box, Check, X } from 'lucide-react';

export function CopyIcon() {
  return <Copy width={20} height={20} strokeWidth={2} />;
}

export function ZapIcon() {
  return <Zap width={24} height={24} strokeWidth={2} />;
}

export function BoxIcon() {
  return <Box width={24} height={24} strokeWidth={2} />;
}

export function CheckIcon() {
  return <Check width={20} height={20} strokeWidth={3} stroke="#10b981" />;
}

export function CloseIcon() {
  return <X width={18} height={18} strokeWidth={2.5} />;
}
