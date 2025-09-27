import React from 'react';
import { CheckCircle2, Circle, Edit3, Trash2, Star, Archive } from 'lucide-react';
import { TodoItemProps } from './types';
import { getPriorityColor } from './constants';

const TodoItem: React.FC<TodoItemProps> = ({ 
  todo, 
  onToggleComplete, 
  onEditTodo, 
  onDeleteTodo,
  onToggleStarred,
  onArchiveTodo
}) => {
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed && !todo.archived;
  
  return (
    <div className={`bg-white dark:bg-dark-800 rounded-lg shadow-sm border dark:border-dark-700 p-3 sm:p-4 transition-all ${
      todo.completed ? 'opacity-60' : ''
    } ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(todo.id)}
          className="mt-1 text-blue-500 hover:text-blue-600 active:text-blue-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 -mt-2 rounded-lg"
        >
          {todo.completed ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Circle className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`font-medium text-sm sm:text-base leading-tight ${
              todo.completed 
                ? 'line-through text-gray-500 dark:text-gray-400' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {todo.title}
              {todo.starred && <Star className="inline-block w-4 h-4 ml-1 text-yellow-500 fill-yellow-500" />}
            </h3>
            <div className="flex gap-1 flex-shrink-0">
              {todo.starred && (
                <button
                  onClick={() => onToggleStarred(todo.id)}
                  className="text-yellow-500 hover:text-yellow-600 active:text-yellow-700 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center rounded"
                  title="Remove from favorites"
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              )}
              {!todo.starred && (
                <button
                  onClick={() => onToggleStarred(todo.id)}
                  className="text-gray-400 dark:text-gray-500 hover:text-yellow-500 active:text-yellow-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center rounded"
                  title="Add to favorites"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onEditTodo(todo)}
                className="text-gray-400 dark:text-gray-500 hover:text-blue-500 active:text-blue-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center rounded"
                title="Edit todo"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onArchiveTodo(todo.id)}
                className="text-gray-400 dark:text-gray-500 hover:text-orange-500 active:text-orange-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center rounded"
                title="Archive todo"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteTodo(todo.id)}
                className="text-gray-400 dark:text-gray-500 hover:text-red-500 active:text-red-600 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center rounded"
                title="Delete todo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {todo.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">{todo.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-2">
            {todo.priority && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(todo.priority)}`}>
                {todo.priority?.charAt(0).toUpperCase() + todo.priority?.slice(1)}
              </span>
            )}
            {todo.category && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 font-medium">
                {todo.category}
              </span>
            )}
            {todo.due_date && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isOverdue 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}>
                Due: {new Date(todo.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;
