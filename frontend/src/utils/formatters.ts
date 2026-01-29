import { OrderStatus, PaymentStatus, ApprovalStatus } from '../types';

// Date and time formatters
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date: Date | string): string => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Currency formatter
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Status formatters
export const formatOrderStatus = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    pending: 'Order Placed',
    preparing: 'Being Prepared',
    ready: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return statusMap[status];
};

export const formatApprovalStatus = (status: ApprovalStatus): string => {
  const statusMap: Record<ApprovalStatus, string> = {
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return statusMap[status];
};

export const formatPaymentStatus = (status: PaymentStatus): string => {
  const statusMap: Record<PaymentStatus, string> = {
    pending: 'Payment Pending',
    completed: 'Payment Successful',
    failed: 'Payment Failed'
  };
  return statusMap[status];
};