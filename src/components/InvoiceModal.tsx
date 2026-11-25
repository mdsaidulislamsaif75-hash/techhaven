import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Printer, X } from 'lucide-react';
import { COUNTRY_CONFIG } from '../data/mockData';
import { useStore } from '../context/StoreContext';
import { formatPaymentMethodLabel, formatPrice, getPaymentStatusLabel } from '../utils/format';

export const InvoiceModal: React.FC = () => {
  const { invoiceOrder, setInvoiceOrder, currency } = useStore();

  if (!invoiceOrder) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setInvoiceOrder(null)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm no-print"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-white text-slate-900 p-4 sm:p-8 shadow-2xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-200 no-print">
            <span className="font-display font-bold text-base sm:text-lg">Commercial Tax Invoice</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F97316] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setInvoiceOrder(null)}
                aria-label="Close invoice"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div>
                <div className="font-display font-extrabold text-2xl text-slate-900">
                  TECHHAVEN
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Global Dispatch · New York · Dubai · London · Toronto · support@techhaven.store
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs text-slate-500">Invoice / Order ID</div>
                <div className="font-mono-num font-bold text-base text-[#F97316]">
                  {invoiceOrder.orderNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <div className="font-bold text-slate-500 uppercase mb-1">Billed &amp; Shipped To</div>
                <div className="font-semibold text-slate-900">{invoiceOrder.customerName}</div>
                <div className="text-slate-600">{invoiceOrder.customerPhone}</div>
                <div className="text-slate-600">{invoiceOrder.shippingAddress}</div>
              </div>
              <div className="sm:text-right">
                <div className="font-bold text-slate-500 uppercase mb-1">Logistics &amp; Payment</div>
                <div className="font-semibold text-slate-900">
                  Method: {formatPaymentMethodLabel(invoiceOrder.paymentMethod)}
                </div>
                <div className="text-slate-700 font-semibold">
                  Payment Status:{' '}
                  <span
                    className={
                      invoiceOrder.paymentMethod === 'cod' ? 'text-amber-600' : 'text-emerald-600'
                    }
                  >
                    {getPaymentStatusLabel(invoiceOrder.paymentMethod)}
                  </span>
                </div>
                <div className="text-slate-600">
                  Region: {COUNTRY_CONFIG[invoiceOrder.country]?.name || 'International'} ({invoiceOrder.shippingTier})
                </div>
                <div className="text-slate-600 font-mono-num">
                  {invoiceOrder.courierName} · {invoiceOrder.trackingNumber}
                </div>
                <div className="text-slate-600 capitalize">
                  Order Status: {invoiceOrder.status.replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full min-w-[480px] text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5">Item &amp; Variant</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Unit</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceOrder.items.map((item) => (
                    <tr key={item.variantSku + item.colorName}>
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-slate-900">{item.title}</div>
                        <div className="text-slate-500">
                          {item.colorName} · {item.sizeName} · SKU {item.variantSku}
                        </div>
                      </td>
                      <td className="py-3 text-center font-mono-num">{item.quantity}</td>
                      <td className="py-3 text-right font-mono-num">
                        {formatPrice(item.unitPriceUsd, currency)}
                      </td>
                      <td className="py-3 text-right font-mono-num font-semibold">
                        {formatPrice(item.unitPriceUsd * item.quantity, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto max-w-xs space-y-1.5 text-xs pt-4 border-t border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono-num">{formatPrice(invoiceOrder.subtotalUsd, currency)}</span>
              </div>
              {invoiceOrder.discountUsd > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Promo Discount</span>
                  <span className="font-mono-num">-{formatPrice(invoiceOrder.discountUsd, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping ({invoiceOrder.shippingTier})</span>
                <span className="font-mono-num">
                  {invoiceOrder.shippingUsd === 0 ? 'FREE' : formatPrice(invoiceOrder.shippingUsd, currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>
                  {invoiceOrder.paymentMethod === 'cod' ? 'Total Due on Delivery' : 'Total Paid'}
                </span>
                <span className="font-mono-num text-[#F97316]">
                  {formatPrice(invoiceOrder.totalUsd, currency)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
