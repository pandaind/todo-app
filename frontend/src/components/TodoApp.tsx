import { useState, useEffect } from 'react';
import Header from './Header';
import FilterTabs from './FilterTabs';
import TodoList from './TodoList';
import TodoForm from './TodoForm';
import LoginForm from './LoginForm';
import SettingsModal from './SettingsModal';
import ToastContainer from './ToastContainer';
import { Todo, User, AuthForm } from './types';
import { loadFromStorage, saveToStorage, getApiUrl, API_CONFIG } from './constants';
import { getUserFriendlyErrorMessage } from '../utils/errorUtils';
import { useToasts } from '../hooks/useToasts';

function TodoApp() {
  // Toast system
  const { toasts, addSuccessToast, addErrorToast, removeToast, clearAllToasts } = useToasts();

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [authForm, setAuthForm] = useState<AuthForm>({
    name: '',
    email: '',
    password: ''
  });
  const [isSignup, setIsSignup] = useState(false);

  // Todos state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'archived' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // UI state
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Settings state
  const [apiKey, setApiKey] = useState(() => loadFromStorage('apiKey', ''));

  // Load initial data
  useEffect(() => {
    const savedUser = loadFromStorage('user', null);
    const savedToken = localStorage.getItem('access_token');
    const savedTodos = loadFromStorage('todos', []);
    
    if (savedUser && savedToken) {
      setUser(savedUser);
      setTodos(savedTodos);
      if (savedTodos.length === 0) {
        fetchTodos();
      } else {
        // Check if user has overdue tasks and set filter accordingly
        const overdueCount = savedTodos.filter((todo: Todo) => {
          const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed && !todo.archived;
          return isOverdue;
        }).length;
        
        if (overdueCount > 0) {
          setFilter('overdue');
        }
      }
    } else if (savedUser && !savedToken) {
      // User is saved but no token - clear the user to force re-login
      localStorage.removeItem('user');
      localStorage.removeItem('todos');
      localStorage.removeItem('apiUrl'); // Remove old API URL setting
    }
  }, []);

  // Auto-dismiss API errors after 10 seconds
  useEffect(() => {
    if (apiError) {
      const timeout = setTimeout(() => {
        setApiError(null);
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [apiError]);

  // Save data when it changes
  useEffect(() => {
    if (user) {
      saveToStorage('user', user);
    }
  }, [user]);

  useEffect(() => {
    if (todos.length > 0) {
      saveToStorage('todos', todos);
    }
  }, [todos]);

  useEffect(() => {
    saveToStorage('apiKey', apiKey);
  }, [apiKey]);

    // API helpers
  const makeApiCall = async (endpoint: string, options: RequestInit = {}, operation?: string) => {
    try {
      // Clear any previous API error on new request
      setApiError(null);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${getApiUrl(API_CONFIG.BASE_URL)}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(apiKey && { 'X-API-Key': apiKey }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = {};
        }
        
        // If it's an authentication error, clear the stored user and token
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          localStorage.removeItem('todos');
          setUser(null);
          setTodos([]);
        }
        
        // Extract error message with proper fallbacks
        let errorMessage = 'An error occurred';
        if (errorData && typeof errorData === 'object') {
          errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error('API Error:', { status: response.status, errorData, errorMessage });
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('makeApiCall error:', error);
      
      let message;
      if (operation) {
        message = getUserFriendlyErrorMessage(error, operation);
      } else {
        message = error instanceof Error ? error.message : 'Network error occurred';
      }
      
      // Set the API error for header display
      setApiError(message);
      
      // Show error toast for user feedback
      addErrorToast(message, 8000);
      
      throw error;
    }
  };

  // Authentication functions
  const handleLogin = async () => {
    if (!authForm.email || !authForm.password || (isSignup && !authForm.name)) {
      setApiError('Please fill in all required fields');
      return;
    }

    // Clear any existing toasts before starting login attempt
    clearAllToasts();

    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const operation = isSignup ? 'signup' : 'login';
      const response = await makeApiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(authForm),
      }, operation);

      // Both signup and login now return the same structure: { access_token, token_type, user }
      setUser(response.user);
      // Store the token for future API calls
      localStorage.setItem('access_token', response.access_token);
      
      setAuthForm({ name: '', email: '', password: '' });
      
      // Clear any existing error toasts before showing success
      clearAllToasts();
      
      // Show success toast
      addSuccessToast(isSignup ? 'Account created successfully!' : 'Welcome back!');
      
      await fetchTodos();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setTodos([]);
    setAuthForm({ name: '', email: '', password: '' });
    setApiError(null); // Clear any API errors
    localStorage.removeItem('user');
    localStorage.removeItem('todos');
    localStorage.removeItem('access_token'); // Remove the token
    localStorage.removeItem('apiUrl'); // Remove old API URL setting
  };

  // Handle switching between login and signup
  const handleToggleSignup = (newIsSignup: boolean) => {
    setIsSignup(newIsSignup);
    setApiError(null); // Clear any API errors when switching modes
    setAuthForm({ name: '', email: '', password: '' }); // Clear form data
  };

  // Handle auth form changes and clear errors
  const handleAuthFormChange = (form: AuthForm) => {
    setAuthForm(form);
    // Clear API error when user starts typing
    if (apiError) {
      setApiError(null);
    }
    // Also clear any error toasts to provide immediate feedback
    const currentErrorToasts = toasts.filter(toast => toast.type === 'error');
    if (currentErrorToasts.length > 0) {
      currentErrorToasts.forEach(toast => removeToast(toast.id));
    }
  };

  // Todo CRUD operations
  const fetchTodos = async () => {
    try {
      const todosData = await makeApiCall('/todos', {}, 'fetch_todos');
      setTodos(todosData);
      
      // Check if user has overdue tasks and set filter accordingly
      if (user) {
        const overdueCount = todosData.filter((todo: Todo) => {
          const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed && !todo.archived;
          return isOverdue;
        }).length;
        
        if (overdueCount > 0) {
          setFilter('overdue');
        }
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = () => {
    setEditingTodo(null);
    setShowTodoForm(true);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowTodoForm(true);
  };

  const handleSubmitTodo = async (todoData: Partial<Todo>) => {
    try {
      if (editingTodo) {
        const updatedTodo = await makeApiCall(`/todos/${editingTodo.id}`, {
          method: 'PUT',
          body: JSON.stringify(todoData),
        }, 'update_todo');
        setTodos(todos.map(t => t.id === editingTodo.id ? updatedTodo : t));
      } else {
        const newTodo = await makeApiCall('/todos', {
          method: 'POST',
          body: JSON.stringify(todoData), // Backend will automatically set user_id
        }, 'create_todo');
        setTodos([...todos, newTodo]);
      }
      setShowTodoForm(false);
      setEditingTodo(null);
      
      // Show success toast
      const successMessage = editingTodo ? 'Todo updated successfully!' : 'Todo created successfully!';
      addSuccessToast(successMessage);
    } catch (error) {
      console.error('Failed to save todo:', error);
      // Let the error bubble up to be handled by the form
      throw error;
    }
  };

  const handleToggleComplete = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = await makeApiCall(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...todo, completed: !todo.completed }),
      }, 'toggle_complete');
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      // The makeApiCall function already sets the apiError state
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await makeApiCall(`/todos/${id}`, { method: 'DELETE' }, 'delete_todo');
      setTodos(todos.filter(t => t.id !== id));
      
      // Show success toast
      addSuccessToast('Todo deleted successfully!');
    } catch (error) {
      console.error('Failed to delete todo:', error);
      // The makeApiCall function already sets the apiError state
    }
  };

  const handleToggleStarred = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = await makeApiCall(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...todo, starred: !todo.starred }),
      }, 'toggle_starred');
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to toggle starred:', error);
      // The makeApiCall function already sets the apiError state
    }
  };

  const handleArchiveTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const updatedTodo = await makeApiCall(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...todo, archived: true }),
      }, 'archive_todo');
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (error) {
      console.error('Failed to archive todo:', error);
      // The makeApiCall function already sets the apiError state
    }
  };

  // Filter todos based on search query (backend already filters by user)
  const filteredTodos = todos.filter(todo =>
    todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    todo.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate todo counts for filter tabs (backend already filters by user)
  const todoCounts = {
    all: todos.filter(t => !t.archived).length,
    active: todos.filter(t => !t.completed && !t.archived).length,
    completed: todos.filter(t => t.completed && !t.archived).length,
    archived: todos.filter(t => t.archived).length,
    overdue: todos.filter(t => {
      const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !t.completed && !t.archived;
      return isOverdue;
    }).length,
  };

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Smart Todos
            </h1>
            
            <LoginForm
              authForm={authForm}
              onAuthFormChange={handleAuthFormChange}
              onLogin={handleLogin}
              isSignup={isSignup}
              setIsSignup={handleToggleSignup}
            />
            
            {apiError && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4">
                <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
                <button
                  onClick={() => setApiError(null)}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main app interface
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <Header
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddTodo={handleAddTodo}
        onLogout={handleLogout}
        onShowSettings={() => setShowSettings(true)}
        apiError={apiError}
        onClearApiError={() => setApiError(null)}
        overdueCount={todoCounts.overdue}
        onShowOverdue={() => setFilter('overdue')}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <FilterTabs
          currentFilter={filter}
          onFilterChange={setFilter}
          todoCounts={todoCounts}
        />

        <TodoList
          todos={filteredTodos}
          filter={filter}
          onToggleComplete={handleToggleComplete}
          onDeleteTodo={handleDeleteTodo}
          onEditTodo={handleEditTodo}
          onToggleStarred={handleToggleStarred}
          onArchiveTodo={handleArchiveTodo}
        />
      </div>

      {/* Todo Form Modal */}
      {showTodoForm && (
        <TodoForm
          isOpen={showTodoForm}
          onClose={() => {
            setShowTodoForm(false);
            setEditingTodo(null);
          }}
          onSubmit={handleSubmitTodo}
          editingTodo={editingTodo}
          apiKey={apiKey}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
        />
      )}
    </div>
  );
}

export default TodoApp;
