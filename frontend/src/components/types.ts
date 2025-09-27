export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: number;
  starred?: boolean;
  archived?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthForm {
  name: string;
  email: string;
  password: string;
}

export interface TodoFormData {
  title: string;
  description: string;
  priority: string;
  due_date: string;
  category: string;
}

export interface LoginFormProps {
  authForm: AuthForm;
  onAuthFormChange: (form: AuthForm) => void;
  onLogin: () => void;
  isSignup: boolean;
  setIsSignup: (signup: boolean) => void;
}

export interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: number) => void;
  onDeleteTodo: (id: number) => void;
  onEditTodo: (todo: Todo) => void;
  onToggleStarred: (id: number) => void;
  onArchiveTodo: (id: number) => void;
}

export interface TodoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (todo: Partial<Todo>) => Promise<void>;
  editingTodo?: Todo | null;
  apiKey: string;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export interface HeaderProps {
  user: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddTodo: () => void;
  onLogout: () => void;
  onShowSettings: () => void;
  apiError: string | null;
  onClearApiError: () => void;
  overdueCount?: number;
  onShowOverdue?: () => void;
}
