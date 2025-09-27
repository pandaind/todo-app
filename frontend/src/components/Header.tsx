import { Plus, Search, LogOut, Settings, AlertCircle } from 'lucide-react';
import { HeaderProps } from './types';
import ThemeToggle from './ThemeToggle';

const Header = ({
  user,
  searchQuery,
  onSearchChange,
  onAddTodo,
  onLogout,
  onShowSettings,
  apiError,
  onClearApiError,
  overdueCount = 0,
  onShowOverdue
}: HeaderProps) => {
  return (
    <div className="bg-white dark:bg-dark-800 shadow-sm border-b dark:border-dark-700 sticky top-0 z-40 transition-colors">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Smart Todos</h1>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                {user?.name || 'User'}
              </span>
              <button
                onClick={onLogout}
                className="p-2 sm:p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 active:bg-red-50 dark:active:bg-red-900/20 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <ThemeToggle />
            
            <button
              onClick={onShowSettings}
              className="p-2 sm:p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 active:bg-blue-50 dark:active:bg-blue-900/20 rounded-lg transition-colors"
              title="API Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <button
              onClick={onAddTodo}
              className="bg-blue-500 dark:bg-blue-600 text-white p-2 sm:p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 active:bg-blue-700 dark:active:bg-blue-800 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
        
        {/* API Error Display */}
        {apiError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-3 sm:p-4 mt-3 sm:mt-4 rounded-r-lg">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">API Error: {apiError}</p>
                <button
                  onClick={onClearApiError}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 active:text-red-900 dark:active:text-red-100 underline mt-2 min-h-[32px] py-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Tasks Notification */}
        {overdueCount > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-3 sm:p-4 mt-3 sm:mt-4 rounded-r-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    You have {overdueCount} overdue task{overdueCount > 1 ? 's' : ''} that need attention!
                  </p>
                </div>
              </div>
              {onShowOverdue && (
                <button
                  onClick={onShowOverdue}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 active:text-red-900 dark:active:text-red-100 underline ml-0 sm:ml-4 min-h-[32px] py-1 self-start sm:self-center"
                >
                  View Overdue
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 sm:mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search todos..."
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base sm:text-sm min-h-[44px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
