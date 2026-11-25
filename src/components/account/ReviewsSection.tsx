import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Edit3,
  MessageSquare,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { PRODUCTS } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { ProductReview } from '../../types/store';
import { SafeImage } from '../SafeImage';

interface PendingReviewItem {
  productId: string;
  title: string;
  image: string;
  variant: string;
  orderNumber: string;
  orderDate: string;
}

export const ReviewsSection: React.FC = () => {
  const { profile } = useAuth();
  const {
    orders,
    getUserReviews,
    addReview,
    updateReview,
    deleteReview,
    navigate,
  } = useStore();

  const [subTab, setSubTab] = useState<'pending' | 'history'>('pending');

  // Write / Edit Review Modal
  const [modalMode, setModalMode] = useState<
    | { type: 'write'; item: PendingReviewItem }
    | { type: 'edit'; review: ProductReview; productTitle: string }
    | null
  >(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const userReviews = getUserReviews();

  const pendingItems = useMemo<PendingReviewItem[]>(() => {
    const reviewedProductIds = new Set(userReviews.map((r) => r.productId));
    const seenProducts = new Set<string>();
    const list: PendingReviewItem[] = [];

    orders
      .filter((o) => o.status === 'delivered')
      .forEach((order) => {
        order.items.forEach((item) => {
          if (reviewedProductIds.has(item.productId) || seenProducts.has(item.productId)) {
            return;
          }
          seenProducts.add(item.productId);
          list.push({
            productId: item.productId,
            title: item.title,
            image: item.image,
            variant: `${item.colorName} · ${item.sizeName}`,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
          });
        });
      });

    return list;
  }, [orders, userReviews]);

  const openWriteModal = (item: PendingReviewItem) => {
    setRating(5);
    setReviewTitle('');
    setReviewComment('');
    setModalMode({ type: 'write', item });
  };

  const openEditModal = (review: ProductReview, productTitle: string) => {
    setRating(review.rating);
    setReviewTitle(review.title);
    setReviewComment(review.comment);
    setModalMode({ type: 'edit', review, productTitle });
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMode) return;

    if (modalMode.type === 'write') {
      await addReview({
        productId: modalMode.item.productId,
        rating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
        authorName: profile?.displayName || 'TechHaven Member',
      });
      setSubTab('history');
    } else {
      await updateReview(modalMode.review, {
        rating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
    }
    setModalMode(null);
  };

  return (
    <div className="space-y-5">
      {/* Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 w-fit max-w-full overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setSubTab('pending')}
          className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            subTab === 'pending'
              ? 'bg-white dark:bg-[#0B0F19] text-[#F97316] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          To Be Reviewed ({pendingItems.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('history')}
          className={`min-h-[40px] px-4 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            subTab === 'history'
              ? 'bg-white dark:bg-[#0B0F19] text-[#F97316] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Review History ({userReviews.length})
        </button>
      </div>

      {/* SUB-TAB 1: TO BE REVIEWED */}
      {subTab === 'pending' && (
        <>
          {pendingItems.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-10 text-center space-y-2.5">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                All delivered purchases reviewed
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You have reviewed every delivered item. New delivered orders will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div
                  key={`${item.orderNumber}_${item.productId}`}
                  className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => navigate('product', { productId: item.productId })}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#F97316] text-left truncate block cursor-pointer"
                      >
                        {item.title}
                      </button>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.variant} · Order <span className="font-mono-num">{item.orderNumber}</span> · Delivered{' '}
                        {new Date(item.orderDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openWriteModal(item)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Write a Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SUB-TAB 2: REVIEW HISTORY */}
      {subTab === 'history' && (
        <>
          {userReviews.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-10 text-center space-y-2.5">
              <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No reviews published yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Share feedback on your delivered hardware from the To Be Reviewed tab.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userReviews.map((rev) => {
                const product = PRODUCTS.find((p) => p.id === rev.productId);
                return (
                  <div
                    key={rev.id}
                    className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {product && (
                          <SafeImage
                            src={product.images[0]}
                            alt={product.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => product && navigate('product', { productId: product.id })}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#F97316] truncate block text-left cursor-pointer"
                          >
                            {product?.title || 'TechHaven Product'}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-0.5 text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < rev.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'
                                  }`}
                                />
                              ))}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-num">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                            {rev.verifiedPurchase && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Verified Purchase
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(rev, product?.title || 'TechHaven Product')}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#F97316] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteReview(rev)}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {rev.title}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* WRITE / EDIT REVIEW MODAL */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalMode(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSubmitModal}
              className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    {modalMode.type === 'write' ? 'Write a Review' : 'Edit Your Review'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {modalMode.type === 'write' ? modalMode.item.title : modalMode.productTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  aria-label="Close review modal"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Overall Rating
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} stars`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-current'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-500 ml-2">
                    {rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Review Headline</label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Detailed Review</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How is the build quality, performance, and battery life?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                >
                  {modalMode.type === 'write' ? 'Submit Review' : 'Save Changes'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
