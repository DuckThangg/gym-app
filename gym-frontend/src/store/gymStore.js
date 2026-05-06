import { create } from 'zustand'

export const useGymStore = create((set, get) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  // Notifications (hội viên sắp hết hạn)
  notifications: [],
  setNotifications: (n) => set({ notifications: n }),

  // Dashboard stats cache
  dashboardData: null,
  setDashboardData: (d) => set({ dashboardData: d }),
}))
