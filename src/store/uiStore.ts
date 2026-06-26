import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface Modal {
  isOpen: boolean;
  data?: unknown;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'dark';
  modals: {
    login: Modal;
    register: Modal;
    upgradePlan: Modal;
    settings: Modal;
    payment: Modal;
    apiKey: Modal;
  };
  toasts: Toast[];
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalName: keyof UIState['modals'], data?: unknown) => void;
  closeModal: (modalName: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

type UIStore = UIState & UIActions;

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultModal: Modal = { isOpen: false };

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      theme: 'dark',
      modals: {
        login: { ...defaultModal },
        register: { ...defaultModal },
        upgradePlan: { ...defaultModal },
        settings: { ...defaultModal },
        payment: { ...defaultModal },
        apiKey: { ...defaultModal },
      },
      toasts: [],

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      openModal: (modalName, data) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalName]: { isOpen: true, data },
          },
        }));
      },

      closeModal: (modalName) => {
        set((state) => ({
          modals: {
            ...state.modals,
            [modalName]: { isOpen: false, data: undefined },
          },
        }));
      },

      closeAllModals: () => {
        set({
          modals: {
            login: { isOpen: false },
            register: { isOpen: false },
            upgradePlan: { isOpen: false },
            settings: { isOpen: false },
            payment: { isOpen: false },
            apiKey: { isOpen: false },
          },
        });
      },

      addToast: (toast) => {
        const id = generateId();
        const duration = toast.duration ?? 5000;

        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));

        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'success', title, message, duration });
  },
  error: (title: string, message?: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'error', title, message, duration });
  },
  info: (title: string, message?: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'info', title, message, duration });
  },
  warning: (title: string, message?: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'warning', title, message, duration });
  },
};
