import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期为更易读的形式
 * @param date 日期对象或日期字符串或时间戳
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string | number | null) {
  if (!date) return '无日期';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 格式化价格，加上货币符号和千位分隔符
 * @param price 价格数值
 * @param currency 货币代码，默认AUD
 * @returns 格式化后的价格字符串
 */
export function formatPrice(price: number, currency: string = 'AUD'): string {
  return new Intl.NumberFormat('en-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}
