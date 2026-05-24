import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      let left = rect.left;
      // If dropdown goes off right edge, shift left
      if (left + dropdownWidth > window.innerWidth - 16) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      // If dropdown goes off left edge, shift right
      if (left < 16) left = 16;
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: left,
        width: dropdownWidth,
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.put(`/notifications/${notification._id}/read`);
        setNotifications(notifications.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }
    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-dark-400 hover:text-dark-100 hover:bg-dark-800 rounded-xl transition-all"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-rose-500 rounded-full ring-2 ring-dark-900 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div
          style={dropdownStyle}
          className="bg-dark-800 border border-dark-700/80 rounded-2xl shadow-premium overflow-hidden"
        >
          <div className="p-4 border-b border-dark-700/60 flex items-center justify-between">
            <span className="font-bold text-sm text-dark-100">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-dark-700/40">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-5 w-5 text-brand-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-dark-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 hover:bg-dark-900/40 cursor-pointer transition-colors flex gap-3 items-start ${
                    !n.isRead ? 'bg-brand-500/5' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs text-dark-200 leading-relaxed ${!n.isRead ? 'font-medium text-dark-100' : ''}`}>
                      {n.text}
                    </p>
                    <span className="text-[10px] text-dark-500 mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(n._id, e)}
                      className="p-1 text-dark-400 hover:text-emerald-400 hover:bg-dark-700 rounded-lg transition-all shrink-0"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;