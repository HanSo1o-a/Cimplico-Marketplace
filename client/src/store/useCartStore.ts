import { create } from "zustand";
import { persist } from "zustand/middleware";

// 购物车项类型
export interface CartItem {
  quantity: number;
  listing: {
    id: number;
    title: string;
    price: number;
    type: string;
    image?: string | null;
    description?: string;
  }
}

// 购物车状态类型
interface CartState {
  items: CartItem[];
  
  // 添加商品到购物车
  addItem: (item: any) => void;
  
  // 从购物车移除商品
  removeItem: (id: number) => void;
  
  // 更新商品数量
  updateQuantity: (id: number, quantity: number) => void;
  
  // 清空购物车
  clearCart: () => void;
  
  // 获取购物车商品总数
  getItemsCount: () => number;
  
  // 获取购物车总金额
  getTotalPrice: () => number;
}

// 创建购物车存储
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const { items } = get();
        
        // 标准化商品对象格式，统一转换为CartItem格式
        let cartItem: CartItem;
        
        // 检查传入的item格式
        if (item.listing) {
          // 如果已经是CartItem格式
          cartItem = item;
        } else {
          // 如果是Listing格式(从产品详情页添加)
          cartItem = {
            quantity: 1,
            listing: {
              id: item.id,
              title: item.title,
              price: item.price,
              type: item.type || "",
              image: item.images && item.images.length > 0 ? item.images[0] : null,
              description: item.description
            }
          };
        }
        
        // 检查商品是否已存在于购物车
        const existingItemIndex = items.findIndex((i) => i.listing.id === cartItem.listing.id);

        if (existingItemIndex >= 0) {
          // 如果商品已存在，更新数量
          const updatedItems = [...items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + cartItem.quantity,
          };
          set({ items: updatedItems });
        } else {
          // 如果商品不存在，添加到购物车
          set({ items: [...items, cartItem] });
        }
      },
      
      removeItem: (id) => {
        const { items } = get();
        set({ items: items.filter((item) => item.listing.id !== id) });
      },
      
      updateQuantity: (id, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          set({ items: items.filter((item) => item.listing.id !== id) });
        } else {
          set({
            items: items.map((item) =>
              item.listing.id === id ? { ...item, quantity } : item
            ),
          });
        }
      },
      
      clearCart: () => set({ items: [] }),
      
      getItemsCount: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.listing.price * item.quantity,
          0
        );
      },
    }),
    {
      name: "cart-storage", // 用于localStorage的键名
      version: 1, // 版本号
    }
  )
);