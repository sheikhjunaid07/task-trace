import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '../api/notificationApi';
import { useRespondInvitationMutation } from '../api/boardApi';
import { useAppDispatch } from '../app/hooks';
import { setActiveTaskId } from '../features/board/boardSlice';
import { getSocket } from '../sockets/socket';
import type { AppNotification, NotificationType } from '../types';
import {
  Bell,
  Mail,
  AtSign,
  Check,
  X,
  CheckCheck,
  FolderKanban,
  CheckSquare,
  ArrowRightCircle,
  Edit3,
  Trash2,
  Users,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HeaderNotifications: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, refetch } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [respondInvitation, { isLoading: isResponding }] = useRespondInvitationMutation();

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  // Real-time socket listener for new notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = () => {
      refetch();
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [refetch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filterTab === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filterTab]);

  const handleRespond = async (
    e: React.MouseEvent,
    notification: AppNotification,
    action: 'accept' | 'decline'
  ) => {
    e.stopPropagation();
    const invitationId = notification.invitation?._id || notification.invitation;
    if (!invitationId) return;

    try {
      await respondInvitation({ invitationId: String(invitationId), action }).unwrap();
      await markAsRead(notification._id).unwrap();
    } catch (err: any) {
      alert(err.data?.message || 'Failed to respond to invitation');
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId).unwrap();
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif._id).unwrap();
    }

    const boardId =
      typeof notif.board === 'object' && notif.board !== null
        ? (notif.board as any)._id
        : notif.board;
    const taskId =
      typeof notif.task === 'object' && notif.task !== null
        ? (notif.task as any)._id
        : notif.task;

    if (boardId) {
      navigate(`/boards/${boardId}`);
      if (taskId) {
        dispatch(setActiveTaskId(String(taskId)));
      }
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'PROJECT_CREATED':
        return {
          icon: FolderKanban,
          bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        };
      case 'TASK_CREATED':
        return {
          icon: CheckSquare,
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
      case 'TASK_MOVED':
        return {
          icon: ArrowRightCircle,
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        };
      case 'TASK_UPDATED':
        return {
          icon: Edit3,
          bg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        };
      case 'TASK_DELETED':
      case 'PROJECT_DELETED':
        return {
          icon: Trash2,
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        };
      case 'BOARD_INVITATION':
        return {
          icon: Mail,
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        };
      case 'TASK_MENTION':
        return {
          icon: AtSign,
          bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        };
      case 'MEMBER_JOINED':
        return {
          icon: Users,
          bg: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        };
      default:
        return {
          icon: Sparkles,
          bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        };
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-mute hover:text-ink hover:bg-surface border border-transparent hover:border-edge transition-all focus:outline-none cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-page animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute right-0 top-12 w-80 sm:w-96 glass-card rounded-2xl border border-edge shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Dropdown Header */}
            <div className="p-3.5 border-b border-edge flex items-center justify-between bg-surface/90">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-ink">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs: All vs Unread */}
            <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 border-b border-edge/60 bg-surface/40 text-xs">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-mute hover:text-ink hover:bg-surface'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('unread')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterTab === 'unread'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-mute hover:text-ink hover:bg-surface'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-mute text-xs italic flex flex-col items-center justify-center">
                  <Bell className="w-8 h-8 text-mute/30 mb-2" />
                  <span>{filterTab === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}</span>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const iconMeta = getNotificationIcon(notif.type);
                  const Icon = iconMeta.icon;

                  return (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${
                        notif.isRead
                          ? 'bg-surface/50 hover:bg-surface border-edge/60'
                          : 'bg-purple-950/30 border-purple-500/30 hover:bg-purple-900/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon type */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border ${iconMeta.bg}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-ink truncate group-hover:text-purple-400 transition-colors">
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-mute shrink-0 ml-2">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-mute mt-0.5 line-clamp-2 leading-snug">
                            {notif.message}
                          </p>

                          {/* Board Invitation Action Buttons */}
                          {notif.type === 'BOARD_INVITATION' && notif.invitation && (
                            <div className="flex items-center space-x-2 mt-2 pt-1">
                              <button
                                type="button"
                                onClick={(e) => handleRespond(e, notif, 'accept')}
                                disabled={isResponding}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center space-x-1 shadow transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleRespond(e, notif, 'decline')}
                                disabled={isResponding}
                                className="px-2.5 py-1 rounded-lg bg-surface hover:bg-rose-500/20 text-mute hover:text-rose-300 font-semibold text-[11px] flex items-center space-x-1 border border-edge transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Decline</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete Single Notification Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, notif._id)}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded text-mute hover:text-rose-400 hover:bg-white/10 flex items-center justify-center transition-all absolute top-2.5 right-2"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
