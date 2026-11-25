import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Copy,
  FileText,
  MapPin,
  Package,
  RotateCcw,
  Truck,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OrderRecord, OrderStatus } from '../../types/store';
import {
  formatPaymentMethodLabel,
  formatPrice,
  getPaymentStatusLabel,
} from '../../utils/format';
import { SafeImage } from '../SafeImage';

type OrderFilterTab = 'all' | 'to_pay' | 'to_ship' | 'to_receive' | 'delivered';

const TRACKING_STEPS: { status: OrderStatus; label: string; detail: string }[] = [
  { status: 'placed', label: 'Order Placed', detail: 'Order received and payment verified.' },
  { status: 'confirmed', label: 'Confirmed & Packed', detail: 'Quality inspected & sealed at fulfillment hub.' },
  { status: 'shipped', label: 'Shipped via Courier', detail: 'Dispatched with international airway bill.' },
  { status: 'out_for_delivery', label: 'Out for Delivery', detail: 'With local courier for doorstep delivery.' },
  { status: 'delivered', label: 'Delivered', detail: 'Signed and delivered to recipient.' },
];

export const OrdersSection: React.FC = () => {
  const {
    orders,
    currency,
    updateOrderStatus,
    reorderItems,
    setInvoiceOrder,
    addToast,
    navigate,
  } = useStore();

  const [filterTab, setFilterTab] = useState<OrderFilterTab>('all');
  const [trackingOrder, setTrackingOrder] = useState<OrderRecord | null>(null);
  const [actionOrder, setActionOrder] = useState<{
    order: OrderRecord;
    mode: 'cancel' | 'return';
  } | null>(null);
  const [reasonNote, setReasonNote] = useState('');

  const filteredOrders = useMemo(() => {
    switch (filterTab) {
      case 'to_pay':
        return orders.filter(
          (o) =>
            (o.paymentMethod === 'cod' && o.status !== 'delivered' && o.status !== 'cancelled') ||
            o.status === 'placed'
        );
      case 'to_ship':
        return orders.filter((o) => o.status === 'placed' || o.status === 'confirmed');
      case 'to_receive':
        return orders.filter((o) => o.status === 'shipped' || o.status === 'out_for_delivery');
      case 'delivered':
        return orders.filter((o) => o.status === 'delivered');
      default:
        return orders;
    }
  }, [orders, filterTab]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      to_pay: orders.filter(
        (o) =>
          (o.paymentMethod === 'cod' && o.status !== 'delivered' && o.status !== 'cancelled') ||
          o.status === 'placed'
      ).length,
      to_ship: orders.filter((o) => o.status === 'placed' || o.status === 'confirmed').length,
      to_receive: orders.filter((o) => o.status === 'shipped' || o.status === 'out_for_delivery').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
    }),
    [orders]
  );

  const getStepIndex = (status: OrderStatus): number => {
    const idx = TRACKING_STEPS.findIndex((s) => s.status === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="space-y-5">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar">
        {[
          { id: 'all' as const, label: `All Orders (${counts.all})` },
          { id: 'to_pay' as const, label: `To Pay (${counts.to_pay})` },
          { id: 'to_ship' as const, label: `To Ship (${counts.to_ship})` },
          { id: 'to_receive' as const, label: `To Receive (${counts.to_receive})` },
          { id: 'delivered' as const, label: `Delivered (${counts.delivered})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterTab(tab.id)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              filterTab === tab.id
                ? 'bg-white dark:bg-[#0B0F19] text-[#F97316] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-10 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No orders match this status filter
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Switch to All Orders or explore the TechHaven catalog to place a new international shipment.
          </p>
          <button
            type="button"
            onClick={() => navigate('shop')}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
          >
            Browse Hardware
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isCancelled = order.status === 'cancelled';
            const isReturned = order.status === 'return_requested';
            const stepIdx = getStepIndex(order.status);

            return (
              <div
                key={order.id}
                className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono-num text-base font-bold text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-xs font-semibold capitalize ${
                          isCancelled
                            ? 'text-red-500'
                            : isReturned
                              ? 'text-amber-600 dark:text-amber-400'
                              : order.status === 'delivered'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-[#F97316]'
                        }`}
                      >
                        · {order.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono-num text-slate-500">
                        · {order.courierName} ({order.trackingNumber})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Placed {new Date(order.createdAt).toLocaleDateString()} · Payment:{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {formatPaymentMethodLabel(order.paymentMethod)}
                      </span>{' '}
                      ({getPaymentStatusLabel(order.paymentMethod)})
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-500">Order Total</div>
                    <div className="text-lg font-bold font-mono-num text-[#F97316]">
                      {formatPrice(order.totalUsd, currency)}
                    </div>
                  </div>
                </div>

                {/* Compact Inline Progress Indicator */}
                {!isCancelled && !isReturned && (
                  <div className="hidden sm:grid sm:grid-cols-5 gap-2 py-1">
                    {TRACKING_STEPS.map((st, idx) => {
                      const completed = idx <= stepIdx;
                      const active = idx === stepIdx;
                      return (
                        <div key={st.status} className="space-y-1">
                          <div className="flex items-center">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                completed
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-white/10 text-slate-400'
                              } ${active ? 'ring-4 ring-emerald-500/20' : ''}`}
                            >
                              {completed ? <Check className="w-3 h-3" /> : idx + 1}
                            </div>
                            {idx < TRACKING_STEPS.length - 1 && (
                              <div
                                className={`h-0.5 flex-1 mx-1 ${
                                  idx < stepIdx ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
                                }`}
                              />
                            )}
                          </div>
                          <div
                            className={`text-[11px] truncate ${
                              completed
                                ? 'font-semibold text-slate-900 dark:text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            {st.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Order Line Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.items.map((item) => (
                    <div
                      key={item.variantSku + item.colorName}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10"
                    >
                      <SafeImage
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.quantity} × {item.sizeName} · {item.colorName}
                        </div>
                      </div>
                      <div className="text-xs font-bold font-mono-num shrink-0">
                        {formatPrice(item.unitPriceUsd * item.quantity, currency)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTrackingOrder(order)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#F97316] hover:text-[#F97316] transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Track Package
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvoiceOrder(order)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#F97316] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Invoice
                  </button>

                  {(order.status === 'placed' || order.status === 'confirmed') && (
                    <button
                      type="button"
                      onClick={() => {
                        setReasonNote('');
                        setActionOrder({ order, mode: 'cancel' });
                      }}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-red-500/30 text-red-500 text-xs font-semibold hover:bg-red-500/10 cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <button
                      type="button"
                      onClick={() => {
                        setReasonNote('');
                        setActionOrder({ order, mode: 'return' });
                      }}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/10 cursor-pointer"
                    >
                      Request Return
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => reorderItems(order)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Order Again
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIVE COURIER TRACKING TIMELINE MODAL */}
      <AnimatePresence>
        {trackingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTrackingOrder(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Live Package Tracking
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Order <span className="font-mono-num font-semibold">{trackingOrder.orderNumber}</span> ·{' '}
                    {trackingOrder.courierName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackingOrder(null)}
                  aria-label="Close tracking modal"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-slate-500">Airway Bill / Tracking ID</div>
                  <div className="text-sm font-mono-num font-bold text-slate-900 dark:text-white">
                    {trackingOrder.trackingNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(trackingOrder.trackingNumber);
                    addToast('Tracking number copied', trackingOrder.trackingNumber, 'info');
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[#F97316] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>

              {trackingOrder.status === 'cancelled' || trackingOrder.status === 'return_requested' ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  This shipment is currently marked as{' '}
                  <strong className="capitalize">{trackingOrder.status.replace(/_/g, ' ')}</strong>.
                  Check My Returns &amp; Cancellations for refund details.
                </div>
              ) : (
                <div className="space-y-4 py-1">
                  {TRACKING_STEPS.map((st, idx) => {
                    const currentIdx = getStepIndex(trackingOrder.status);
                    const completed = idx <= currentIdx;
                    const active = idx === currentIdx;
                    return (
                      <div key={st.status} className="flex items-start gap-3.5">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              completed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-400'
                            } ${active ? 'ring-4 ring-emerald-500/20' : ''}`}
                          >
                            {completed ? <Check className="w-4 h-4" /> : idx + 1}
                          </div>
                          {idx < TRACKING_STEPS.length - 1 && (
                            <div
                              className={`w-0.5 h-8 mt-1 ${
                                idx < currentIdx ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                completed ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                              }`}
                            >
                              {st.label}
                            </span>
                            {active && (
                              <span className="text-[11px] font-semibold text-emerald-500">
                                Current Stage
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {st.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 flex items-start gap-2.5 text-xs">
                <MapPin className="w-4 h-4 text-[#F97316] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Destination Address
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {trackingOrder.shippingAddress}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CANCEL / RETURN MODAL */}
      <AnimatePresence>
        {actionOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionOrder(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                {actionOrder.mode === 'cancel'
                  ? `Cancel Order ${actionOrder.order.orderNumber}`
                  : `Request 7-Day Return (${actionOrder.order.orderNumber})`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please provide a brief reason so our global logistics team can process this immediately.
              </p>
              <textarea
                rows={3}
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder="Reason for cancellation or return..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setActionOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateOrderStatus(
                      actionOrder.order.id,
                      actionOrder.mode === 'cancel' ? 'cancelled' : 'return_requested',
                      reasonNote
                    );
                    setActionOrder(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F97316] text-white text-xs font-semibold cursor-pointer"
                >
                  Confirm Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
