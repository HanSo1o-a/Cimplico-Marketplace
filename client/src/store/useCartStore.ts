import { create } from "zustand";
import { persist } from "zustand/middleware";

// 购物车项类型
export interface CartItem {
  id: number;
  title: string;
  price: number;
  type: string;
  image: string | null;
  quantity: number;
}

// 购物车状态类型
interface CartState {
  items: CartItem[];
  
  // 添加商品到购物车
  addItem: (item: CartItem) => void;
  
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
        const existingItemIndex = items.findIndex((i) => i.id === item.id);

        if (existingItemIndex >= 0) {
          // 如果商品已存在，更新数量
          const updatedItems = [...items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + item.quantity,
          };
          set({ items: updatedItems });
        } else {
          // 如果商品不存在，添加到购物车
          set({ items: [...items, item] });
        }
      },
      
      removeItem: (id) => {
        const { items } = get();
        set({ items: items.filter((item) => item.id !== id) });
      },
      
      updateQuantity: (id, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          set({ items: items.filter((item) => item.id !== id) });
        } else {
          set({
            items: items.map((item) =>
              item.id === id ? { ...item, quantity } : item
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
          (total, item) => total + item.price * item.quantity,
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