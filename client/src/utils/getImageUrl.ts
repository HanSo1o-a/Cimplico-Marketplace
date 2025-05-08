// 工具函数：根据图片路径拼接完整URL（自动适配本地和生产环境）
export function getImageUrl(path?: string) {
  if (!path) return "/placeholder-product.svg";
  if (path.startsWith("http")) return path;
  // 兼容 /uploads/xxx 或 uploads/xxx
  const realPath = path.startsWith("/") ? path : "/" + path;
  return `${window.location.origin}${realPath}`;
}
