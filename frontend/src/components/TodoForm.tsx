import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { TodoFormProps } from './types';
import { priorities, categories, getApiUrl, API_CONFIG } from './constants';
import { getUserFriendlyErrorMessage } from '../utils/errorUtils';

const TodoForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingTodo,
  apiKey
}: TodoFormProps) => {
  const [formData, setFormData] = useState({
    title: editingTodo?.title || '',
    description: editingTodo?.description || '',
    due_date: editingTodo?.due_date ? editingTodo.due_date.split('T')[0] : '',
    priority: editingTodo?.priority || 'medium',
    category: editingTodo?.category || '',
    starred: editingTodo?.starred || false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Update form data when editingTodo changes
  useEffect(() => {
    if (editingTodo) {
      setFormData({
        title: editingTodo.title || '',
        description: editingTodo.description || '',
        due_date: editingTodo.due_date ? editingTodo.due_date.split('T')[0] : '',
        priority: editingTodo.priority || 'medium',
        category: editingTodo.category || '',
        starred: editingTodo.starred || false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        category: '',
        starred: false,
      });
    }
    // Clear any existing form errors when opening the form
    setFormError(null);
  }, [editingTodo, isOpen]);

  // Auto-dismiss form errors after 8 seconds
  useEffect(() => {
    if (formError) {
      const timeout = setTimeout(() => {
        setFormError(null);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [formError]);

  const generateSubtasks = async () => {
    if (!formData.title || !apiKey) return;
    
    setIsGenerating(true);
    setFormError(null);
    
    try {
      const response = await fetch(`${getApiUrl(API_CONFIG.BASE_URL)}/ai/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to generate subtasks');
      }
      
      const result = await response.json();
      setFormData(prev => ({
        ...prev,
        description: result.subtasks || prev.description
      }));
    } catch (error) {
      const message = getUserFriendlyErrorMessage(error, 'generate_subtasks');
      setFormError(message);
      console.error('Failed to generate subtasks:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      await onSubmit(formData);
      // Form submission was successful, parent will handle closing
    } catch (error) {
      const operation = editingTodo ? 'update_todo' : 'create_todo';
      const message = getUserFriendlyErrorMessage(error, operation);
      setFormError(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-dark-800 rounded-t-xl sm:rounded-lg w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto border-t sm:border dark:border-dark-700 animate-slide-up sm:animate-none">
        <div className="flex justify-between items-center p-4 sm:p-6 pb-3 sm:pb-4 border-b dark:border-dark-600">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {editingTodo ? 'Edit Todo' : 'Add New Todo'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 active:bg-gray-200 dark:active:bg-dark-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pt-3 sm:pt-4 space-y-4 sm:space-y-5">
          {/* Form Error Display */}
          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500 mr-2" />
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-base sm:text-sm min-h-[44px]"
              placeholder="Enter todo title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-base sm:text-sm min-h-[80px]"
                placeholder="Add description or details"
                rows={3}
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={generateSubtasks}
                  disabled={isGenerating || !formData.title}
                  className="absolute bottom-2 right-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 active:bg-blue-300 dark:active:bg-blue-900/70 disabled:opacity-50 min-h-[32px] font-medium"
                >
                  {isGenerating ? 'Generating...' : 'AI Subtasks'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-base sm:text-sm min-h-[44px]"
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-base sm:text-sm min-h-[44px]"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              className="w-full px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-base sm:text-sm min-h-[44px]"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="starred"
              checked={formData.starred}
              onChange={(e) => setFormData(prev => ({ ...prev, starred: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="starred" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Mark as favorite
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t dark:border-dark-600">
            <button
              type="submit"
              className="flex-1 bg-blue-500 dark:bg-blue-600 text-white py-3 sm:py-2 px-4 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 active:bg-blue-700 dark:active:bg-blue-800 transition-colors font-medium text-base sm:text-sm min-h-[44px]"
            >
              {editingTodo ? 'Update' : 'Add'} Todo
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 active:bg-gray-100 dark:active:bg-dark-600 transition-colors font-medium text-base sm:text-sm min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoForm;
