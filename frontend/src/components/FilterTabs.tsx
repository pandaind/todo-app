interface FilterTabsProps {
  currentFilter: 'all' | 'active' | 'completed' | 'archived' | 'overdue';
  onFilterChange: (filter: 'all' | 'active' | 'completed' | 'archived' | 'overdue') => void;
  todoCounts: {
    all: number;
    active: number;
    completed: number;
    archived: number;
    overdue: number;
  };
}

const FilterTabs = ({
  currentFilter,
  onFilterChange,
  todoCounts
}: FilterTabsProps) => {
  const tabs = [
    { key: 'all', label: 'All', count: todoCounts.all },
    { key: 'active', label: 'Active', count: todoCounts.active },
    { key: 'overdue', label: 'Overdue', count: todoCounts.overdue },
    { key: 'completed', label: 'Completed', count: todoCounts.completed },
    { key: 'archived', label: 'Archived', count: todoCounts.archived },
  ] as const;

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border dark:border-dark-700 mb-4 sm:mb-6 overflow-hidden">
      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`flex-shrink-0 px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium transition-colors min-h-[52px] flex items-center justify-center whitespace-nowrap ${
              index === 0 ? 'min-w-[80px]' : 'min-w-[90px]'
            } ${
              currentFilter === tab.key
                ? tab.key === 'overdue'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-b-2 border-red-700 dark:border-red-400'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-700 active:bg-gray-100 dark:active:bg-dark-600'
            }`}
          >
            <span className="flex items-center gap-1 sm:gap-2">
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                  currentFilter === tab.key
                    ? tab.key === 'overdue'
                      ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                      : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                    : tab.key === 'overdue'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-dark-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterTabs;
