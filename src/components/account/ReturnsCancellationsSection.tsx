import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Ban,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatPaymentMethodLabel, formatPrice } from '../../utils/format';
import { SafeImage } from '../SafeImage';

const RETURN_REASONS = [
  'Wrong Variant / Size Ordered',
  'Item Defective or Damaged in Transit',
  'Missing Accessory in Box',
  'Changed Mind (7-Day Return Window)',
];

export const ReturnsCancellationsSection: React.FC = () => {
  const {
    accountExtras,
    orders,
    currency,
    submitReturnRequest,
  } = useStore();

  const [subTab, setSubTab] = useState<'returns' | 'cancellations'>('returns');
  const [modalOpen, setModalOpen] = useState(false);

  const eligibleReturnOrders = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled'),
    [orders]
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    () => eligibleReturnOrders[0]?.id || ''
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(
    () => eligibleReturnOrders[0]?.items[0]?.productId || ''
  );
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnDetails, setReturnDetails] = useState('');

  const cancelledOrders = useMemo(
    () => orders.filter((o) => o.status === 'cancelled'),
    [orders]
  );

  const selectedOrder = eligibleReturnOrders.find((o) => o.id === selectedOrderId) || eligibleReturnOrders[0];

  const handleOpenReturnModal = () => {
    const first = eligibleReturnOrders[0];
    if (first) {
      setSelectedOrderId(first.id);
      setSelectedProductId(first.items[0]?.productId || '');
    }
    setReturnReason(RETURN_REASONS[0]);
    setReturnDetails('');
    setModalOpen(true);
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    await submitReturnRequest({
      orderId: selectedOrder.id,
      productId: selectedProductId || selectedOrder.items[0]?.productId || '',
      reason: returnReason,
      details: returnDetails.trim() || undefined,
    });
    setModalOpen(false);
    setSubTab('returns');
  };

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSubTab('returns')}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              subTab === 'returns'
                ? 'bg-white dark:bg-[#0B0F19] text-[#F97316] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            My Returns ({accountExtras.returnRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('cancellations')}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              subTab === 'cancellations'
                ? 'bg-white dark:bg-[#0B0F19] text-[#F97316] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            My Cancellations ({cancelledOrders.length})
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenReturnModal}
          disabled={eligibleReturnOrders.length === 0}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Submit New Return Request
        </button>
      </div>

      {/* SUB-TAB 1: MY RETURNS */}
      {subTab === 'returns' && (
        <>
          {accountExtras.returnRequests.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-10 text-center space-y-2.5">
              <RotateCcw className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No return requests found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All TechHaven orders qualify for 7-day easy international returns with prepaid courier pickup.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {accountExtras.returnRequests.map((ret) => {
                const statusColor =
                  ret.status === 'Refunded'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : ret.status === 'Approved'
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-amber-600 dark:text-amber-400';

                return (
                  <div
                    key={ret.id}
                    className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <SafeImage
                        src={ret.productImage}
                        alt={ret.productTitle}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono-num font-bold text-slate-900 dark:text-white">
                            {ret.returnNumber}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className={`font-semibold ${statusColor}`}>
                            {ret.status}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="font-mono-num text-slate-500">
                            Order {ret.orderNumber}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {ret.productTitle}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Reason: <span className="font-medium text-slate-700 dark:text-slate-200">{ret.reason}</span>
                          {ret.details ? ` — ${ret.details}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-[11px] text-slate-500">Refund Amount</div>
                      <div className="text-base font-bold font-mono-num text-[#F97316]">
                        {formatPrice(ret.refundAmountUsd, currency)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono-num">
                        {new Date(ret.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SUB-TAB 2: MY CANCELLATIONS */}
      {subTab === 'cancellations' && (
        <>
          {cancelledOrders.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-10 text-center space-y-2.5">
              <Ban className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No cancelled orders
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cancelled orders and instant refund statuses appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {cancelledOrders.map((ord) => {
                const reason =
                  accountExtras.cancellationReasons[ord.id] ||
                  'Cancelled prior to international courier dispatch.';
                const refundStatus =
                  ord.paymentMethod === 'cod'
                    ? 'No Charge (COD Cancelled)'
                    : `Refunded via ${formatPaymentMethodLabel(ord.paymentMethod)}`;

                return (
                  <div
                    key={ord.id}
                    className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono-num font-bold text-slate-900 dark:text-white">
                            {ord.orderNumber}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="font-semibold text-red-500">Cancelled</span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="font-mono-num text-slate-500">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Reason: <span className="font-medium">{reason}</span>
                        </div>
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {refundStatus}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-[11px] text-slate-500">Order Value</div>
                        <div className="text-base font-bold font-mono-num text-slate-900 dark:text-white">
                          {formatPrice(ord.totalUsd, currency)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
                      {ord.items.map((item) => (
                        <div
                          key={item.variantSku}
                          className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300"
                        >
                          <SafeImage
                            src={item.image}
                            alt={item.title}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <span>
                            {item.quantity} × {item.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL: SUBMIT NEW RETURN REQUEST */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreateReturn}
              className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Submit New Return Request
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close return modal"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Select Order</label>
                <select
                  value={selectedOrder?.id || ''}
                  onChange={(e) => {
                    const ord = eligibleReturnOrders.find((o) => o.id === e.target.value);
                    setSelectedOrderId(e.target.value);
                    setSelectedProductId(ord?.items[0]?.productId || '');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm font-mono-num"
                >
                  {eligibleReturnOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.orderNumber} ({new Date(ord.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <div>
                  <label className="block text-xs font-semibold mb-1">Select Item</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                  >
                    {selectedOrder.items.map((it) => (
                      <option key={it.variantSku} value={it.productId}>
                        {it.title} ({it.sizeName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">Return Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Additional Details</label>
                <textarea
                  rows={3}
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  placeholder="Optional description for courier pickup..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Submit Return
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
