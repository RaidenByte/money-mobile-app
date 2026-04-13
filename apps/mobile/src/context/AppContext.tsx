import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiClient } from '../api/client';
import { Category, Transaction, TransactionType, User } from '../types';
import { clearAuthToken, readAuthToken, writeAuthToken } from '../utils/authStorage';

interface AppContextValue {
  isAuthenticated: boolean;
  sessionLoading: boolean;
  currentUser: User | null;
  authLoading: boolean;
  authError: string | null;
  dataLoading: boolean;
  dataError: string | null;
  transactions: Transaction[];
  categories: Category[];
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  addTransaction: (payload: Omit<Transaction, 'id'>) => Promise<boolean>;
  updateTransaction: (id: string, payload: Omit<Transaction, 'id'>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  addCategory: (name: string, type: TransactionType) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const sortTransactions = (items: Transaction[]) =>
  [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
};

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const refreshData = useCallback(async () => {
    if (!apiClient.getToken()) return;

    setDataError(null);
    setDataLoading(true);
    try {
      const [nextCategories, nextTransactions] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getTransactions(),
      ]);
      setCategories(nextCategories);
      setTransactions(sortTransactions(nextTransactions));
    } catch (error) {
      setDataError(getErrorMessage(error, '数据加载失败，请稍后重试'));
    } finally {
      setDataLoading(false);
    }
  }, []);

  const login = useCallback(
    async (phone: string, password: string) => {
      setAuthLoading(true);
      setAuthError(null);

      try {
        const result = await apiClient.login(phone.trim(), password.trim());
        apiClient.setToken(result.token);
        await writeAuthToken(result.token);
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        await refreshData();
      } catch (error) {
        setAuthError(getErrorMessage(error, '登录失败，请检查手机号和密码'));
        setIsAuthenticated(false);
        setCurrentUser(null);
        apiClient.setToken(null);
        await clearAuthToken();
      } finally {
        setAuthLoading(false);
      }
    },
    [refreshData],
  );

  const register = useCallback(
    async (name: string, phone: string, password: string) => {
      setAuthLoading(true);
      setAuthError(null);

      try {
        const result = await apiClient.register(name.trim(), phone.trim(), password.trim());
        apiClient.setToken(result.token);
        await writeAuthToken(result.token);
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        await refreshData();
      } catch (error) {
        setAuthError(getErrorMessage(error, '注册失败，请稍后重试'));
        setIsAuthenticated(false);
        setCurrentUser(null);
        apiClient.setToken(null);
        await clearAuthToken();
      } finally {
        setAuthLoading(false);
      }
    },
    [refreshData],
  );

  const logout = useCallback(() => {
    apiClient.setToken(null);
    void clearAuthToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setDataError(null);
    setTransactions([]);
    setCategories([]);
  }, []);

  const addTransaction = useCallback(async (payload: Omit<Transaction, 'id'>) => {
    try {
      const created = await apiClient.createTransaction(payload);
      setTransactions((prev) => sortTransactions([created, ...prev]));
      setDataError(null);
      return true;
    } catch (error) {
      setDataError(getErrorMessage(error, '新增记录失败'));
      return false;
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, payload: Omit<Transaction, 'id'>) => {
    try {
      const updated = await apiClient.updateTransaction(id, payload);
      setTransactions((prev) => sortTransactions(prev.map((item) => (item.id === id ? updated : item))));
      setDataError(null);
      return true;
    } catch (error) {
      setDataError(getErrorMessage(error, '修改记录失败'));
      return false;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const result = await apiClient.deleteTransaction(id);
      if (!result.success) return false;
      setTransactions((prev) => prev.filter((item) => item.id !== id));
      setDataError(null);
      return true;
    } catch (error) {
      setDataError(getErrorMessage(error, '删除记录失败'));
      return false;
    }
  }, []);

  const addCategory = useCallback(async (name: string, type: TransactionType) => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    try {
      const created = await apiClient.createCategory(trimmed, type);
      setCategories((prev) => [...prev, created]);
      setDataError(null);
      return true;
    } catch (error) {
      setDataError(getErrorMessage(error, '新增分类失败'));
      return false;
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await readAuthToken();
        if (!token) return;

        apiClient.setToken(token);
        const user = await apiClient.me();
        setCurrentUser(user);
        setIsAuthenticated(true);
        await refreshData();
      } catch {
        apiClient.setToken(null);
        await clearAuthToken();
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setSessionLoading(false);
      }
    };

    void restoreSession();
  }, [refreshData]);

  const value = useMemo<AppContextValue>(
    () => ({
      isAuthenticated,
      sessionLoading,
      currentUser,
      authLoading,
      authError,
      dataLoading,
      dataError,
      transactions,
      categories,
      login,
      register,
      logout,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      refreshData,
    }),
    [
      isAuthenticated,
      sessionLoading,
      currentUser,
      authLoading,
      authError,
      dataLoading,
      dataError,
      transactions,
      categories,
      login,
      register,
      logout,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      refreshData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
