import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化价格，加上货币符号和千位分隔符
 * @param price 价格数值
 * @param currency 货币代码，默认CNY
 * @returns 格式化后的价格字符串
 */
export function formatPrice(price: number, currency: string = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}
