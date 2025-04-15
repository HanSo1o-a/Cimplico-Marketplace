import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";
import { useAuth } from "./use-auth";

// Auth0元数据类型
export interface Auth0Metadata {
  uuid: string;
  workpapers: {
    firms: Array<{
      id: string;
      shortId: string;
    }>;
  };
}

type Auth0ContextType = {
  metadata: Auth0Metadata | null;
  firms: Array<{
    id: string;
    shortId: string;
  }> | null;
  isLoading: boolean;
  error: Error | null;
  selectedFirmId: string | null;
  setSelectedFirmId: (firmId: string) => void;
};

export const Auth0Context = createContext<Auth0ContextType | null>(null);

export function Auth0Provider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // 获取Auth0元数据
  const {
    data: metadata,
    error,
    isLoading,
  } = useQuery<Auth0Metadata | undefined, Error>({
    queryKey: ["/api/auth0/metadata"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user, // 仅当用户已登录时启用
  });

  // 获取企业列表
  const { data: firms } = useQuery<Array<{ id: string; shortId: string; }> | undefined, Error>({
    queryKey: ["/api/auth0/firms"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user, // 仅当用户已登录时启用
  });

  // 当前选中的企业ID，默认为第一个企业
  const [selectedFirmId, setSelectedFirmIdState] = useState<string | null>(
    firms && firms.length > 0 ? firms[0].id : null
  );

  // 更新选中的企业ID时，也设置请求头
  const setSelectedFirmId = (firmId: string) => {
    setSelectedFirmIdState(firmId);
    // 将选中的firmId保存到localStorage中
    localStorage.setItem('selectedFirmId', firmId);
  };

  // 在组件挂载时，尝试从localStorage恢复选中的企业ID
  useEffect(() => {
    const savedFirmId = localStorage.getItem('selectedFirmId');
    if (savedFirmId && firms && firms.some(firm => firm.id === savedFirmId)) {
      setSelectedFirmIdState(savedFirmId);
    }
  }, [firms]);

  // 每次请求前添加X-Firm-Id请求头
  useEffect(() => {
    if (selectedFirmId) {
      // 设置全局请求拦截器，为每个请求添加X-Firm-Id头
      // 注意：这里依赖于你的HTTP客户端如何实现
      // 如果使用axios，可以使用axios.interceptors
      // 如果使用fetch，可以通过修改apiRequest函数来实现
      console.log(`设置当前企业ID: ${selectedFirmId}`);
      // 这里只是一个演示，实际实现取决于你的HTTP客户端
    }
  }, [selectedFirmId]);

  return (
    <Auth0Context.Provider
      value={{
        metadata: metadata ?? null,
        firms: firms ?? null,
        isLoading,
        error,
        selectedFirmId,
        setSelectedFirmId,
      }}
    >
      {children}
    </Auth0Context.Provider>
  );
}

export function useAuth0() {
  const context = useContext(Auth0Context);
  if (!context) {
    throw new Error("useAuth0 must be used within an Auth0Provider");
  }
  return context;
}