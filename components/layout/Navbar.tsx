'use client'

import { Bell, Menu, LayoutGrid, X, Check, Megaphone, ClipboardCheck, DollarSign, Settings, Building2, LogOut, UserPlus, UserMinus, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, NotificationType } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface NavbarProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Navbar({ onMenuClick, showMenu = true }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'company_join':
      case 'join_approved':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'company_leave':
      case 'join_rejected':
      case 'application_rejected':
        return <UserMinus className="h-4 w-4 text-destructive" />;
      case 'staff_request':
        return <UserPlus className="h-4 w-4 text-primary" />;
      case 'role_assigned':
        return <Shield className="h-4 w-4 text-primary" />;
      case 'announcement':
      case 'company_update':
        return <Megaphone className="h-4 w-4 text-primary" />;
      case 'verification':
      case 'verification_request':
        return <ClipboardCheck className="h-4 w-4 text-yellow-500" />;
      case 'salary_published':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);

    const routes: Record<NotificationType, string> = {
      company_join: '/dashboard',
      company_leave: '/company-apply',
      application_rejected: '/company-apply',
      staff_request: '/staff-requests',
      role_assigned: '/dashboard',
      announcement: '/dashboard',
      verification: '/employee-verification',
      leave_request: '/leave-requests',
      salary_published: '/salary',
      // legacy
      company_update: '/company-settings',
      verification_request: '/employee-verification',
      join_approved: '/dashboard',
      join_rejected: '/dashboard',
      break_alert: '/dashboard',
      general: '/dashboard',
    };

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else {
      router.push(routes[notification.type]);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {showMenu && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">TeamOps</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                        <Check className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                            }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="hidden h-8 w-px bg-border sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-full p-1 hover:bg-accent transition-colors">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                      {user.avatar || user.firstName?.charAt(0) || 'U'}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {/* User info header */}
                  <div className="flex items-center gap-3 px-3 py-3 border-b border-border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {user.avatar || user.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary capitalize">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    {/* Settings */}
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Settings
                      </Link>
                    </DropdownMenuItem>

                    {/* Company Apply */}
                    <DropdownMenuItem asChild>
                      <Link href="/company-apply" className="flex items-center gap-2 cursor-pointer">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Company
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Logout */}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
