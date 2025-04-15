import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Listing } from '@shared/schema';

interface CartItem {
  listing: Listing;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (listing: Listing, quantity?: number) => void;
  removeItem: (listingId: number) => void;
  updateQuantity: (listingId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemsCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (listing: Listing, quantity = 1) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.listing.id === listing.id
          );
          
          if (existingItemIndex >= 0) {
            // 商品已存在，增加数量
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += quantity;
            return { items: newItems };
          } else {
            // 新增商品
            return { items: [...state.items, { listing, quantity }] };
          }
        });
      },
      
      removeItem: (listingId: number) => {
        set((state) => ({
          items: state.items.filter((item) => item.listing.id !== listingId)
        }));
      },
      
      updateQuantity: (listingId: number, quantity: number) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.listing.id === listingId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          )
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.listing.price * item.quantity,
          0
        );
      },
      
      getItemsCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'cimplico-cart',
      partialize: (state) => ({ items: state.items })
    }
  )
);
