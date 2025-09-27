import { Trash2, Edit, Check, Archive, Star } from 'lucide-react';
import { Todo } from './types';

interface TodoListProps {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed' | 'archived' | 'overdue';
  onToggleComplete: (id: number) => void;
  onDeleteTodo: (id: number) => void;
  onEditTodo: (todo: Todo) => void;
  onToggleStarred: (id: number) => void;
  onArchiveTodo: (id: number) => void;
}

const TodoList = ({
  todos,
  filter,
  onToggleComplete,
  onDeleteTodo,
  onEditTodo,
  onToggleStarred,
  onArchiveTodo
}: TodoListProps) => {
  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed && !todo.archived;
      case 'completed':
        return todo.completed && !todo.archived;
      case 'archived':
        return todo.archived;
      case 'overdue':
        const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed && !todo.archived;
        return isOverdue;
      default:
        return !todo.archived;
    }
  });

  if (filteredTodos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">
          {filter === 'all' && 'No todos yet'}
          {filter === 'active' && 'No active todos'}
          {filter === 'completed' && 'No completed todos'}
          {filter === 'archived' && 'No archived todos'}
          {filter === 'overdue' && 'No overdue todos'}
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {filter === 'all' && 'Add your first todo to get started!'}
          {filter === 'active' && 'All caught up! 🎉'}
          {filter === 'completed' && 'Complete some todos to see them here.'}
          {filter === 'archived' && 'Archive completed todos to see them here.'}
          {filter === 'overdue' && 'Great! You have no overdue tasks. ✅'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredTodos.map(todo => {
        const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed && !todo.archived;
        
        return (
        <div
          key={todo.id}
          className={`bg-white dark:bg-dark-800 rounded-lg shadow-sm border dark:border-dark-700 p-4 transition-all hover:shadow-md dark:hover:bg-dark-700 ${
            todo.completed ? 'opacity-75' : ''
          } ${isOverdue ? 'border-l-4 border-l-red-500 dark:border-l-red-400' : ''}`}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggleComplete(todo.id)}
              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                todo.completed
                  ? 'bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600'
                  : 'border-gray-300 dark:border-dark-600 hover:border-green-500 dark:hover:border-green-400'
              }`}
            >
              {todo.completed && <Check className="w-3 h-3" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-medium text-gray-900 dark:text-white ${
                  todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
                }`}>
                  {todo.title}
                </h3>
                {isOverdue && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
                    OVERDUE
                  </span>
                )}
                {todo.starred && (
                  <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400 fill-current" />
                )}
                {todo.priority && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    todo.priority === 'high'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : todo.priority === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    {todo.priority}
                  </span>
                )}
              </div>
              
              {todo.description && (
                <p className={`text-sm text-gray-600 dark:text-gray-300 mb-2 ${
                  todo.completed ? 'line-through' : ''
                }`}>
                  {todo.description}
                </p>
              )}
              
              {todo.category && (
                <span className="inline-block text-xs bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                  {todo.category}
                </span>
              )}
              
              {todo.due_date && (
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isOverdue
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    {isOverdue 
                      ? `Overdue by ${Math.ceil((new Date().getTime() - new Date(todo.due_date).getTime()) / (1000 * 60 * 60 * 24))} day(s)`
                      : `Due: ${new Date(todo.due_date).toLocaleDateString()}`
                    }
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggleStarred(todo.id)}
                className={`p-2 rounded-lg transition-colors ${
                  todo.starred
                    ? 'text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300'
                    : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-400'
                }`}
                title={todo.starred ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${todo.starred ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={() => onEditTodo(todo)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                title="Edit todo"
              >
                <Edit className="w-4 h-4" />
              </button>
              
              {!todo.archived && todo.completed && (
                <button
                  onClick={() => onArchiveTodo(todo.id)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-colors"
                  title="Archive todo"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => onDeleteTodo(todo.id)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                title="Delete todo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default TodoList;
