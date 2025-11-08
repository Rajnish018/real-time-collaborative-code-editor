"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from '../../context/authcontext.js';
import {
  HomeIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  CodeIcon,
  UsersIcon,
  HistoryIcon,
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  // Helper to detect active tab
  const isActive = (path) =>
    pathname === path
      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800";

  const navigationItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: HomeIcon,
      description: "Overview"
    },
    {
      path: "/dashboard/editor",
      label: "Code Editor",
      icon: CodeIcon,
      description: "Start coding"
    },
    {
      path: "/dashboard/rooms",
      label: "My Rooms",
      icon: UsersIcon,
      description: "Manage rooms"
    },
    {
      path: "/dashboard/history",
      label: "History",
      icon: HistoryIcon,
      description: "Recent activity"
    },
    {
      path: "/dashboard/profile",
      label: "Profile",
      icon: UserIcon,
      description: "Account settings"
    },
    {
      path: "/dashboard/settings",
      label: "Settings",
      icon: SettingsIcon,
      description: "Preferences"
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/90 backdrop-blur-xl border-r border-slate-200/60 p-6 flex flex-col justify-between transition-all duration-300 transform ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:z-0`}
      >
        {/* Top Section */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CollabSpace
                </h2>
                <p className="text-xs text-slate-500">Development Hub</p>
              </div>
            </div>
            <button
              className="md:hidden text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setShowSidebar(false)}
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-semibold shadow-lg">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">
                    {user.name || 'User'}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">
                    {user.email || 'No email'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setShowSidebar(false);
                  }}
                  className={`flex items-center gap-4 p-3 rounded-2xl w-full text-left transition-all duration-200 group ${isActive(
                    item.path
                  )}`}
                >
                  <div className={`p-2 rounded-xl transition-all duration-200 ${
                    pathname === item.path 
                      ? "bg-white/20" 
                      : "bg-slate-100 group-hover:bg-slate-200"
                  }`}>
                    <Icon size={20} className={
                      pathname === item.path ? "text-white" : "text-slate-600"
                    } />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs ${
                      pathname === item.path ? "text-white/80" : "text-slate-500"
                    }`}>
                      {item.description}
                    </div>
                  </div>
                  {pathname === item.path && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Fixed Footer Logout */}
        <div className="border-t border-slate-200/60 pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-2xl w-full text-left bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <div className="p-2 rounded-xl bg-white/20">
              <LogOutIcon size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Logout</div>
              <div className="text-xs text-white/80">Sign out of your account</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Toggle */}
      <button
        className="md:hidden p-3 fixed top-4 left-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg z-30"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        <MenuIcon size={20} />
      </button>

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:ml-0 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}