import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Filter, 
    Plus, 
    Trash2, 
    Pencil, 
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    ExternalLink
} from 'lucide-react';
import { ShadowCard } from '../../../ui/ShadowCard';
import { Button } from '../../../ui/Button';
import { Skeleton } from '../../../ui/Skeleton';
import { todoService, type Todo, TodoListStatus } from '@/api/todoService';
import TodoModal from './components/TodoModal';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EngagementTodoViewProps {
    engagementId?: string;
    service?: string;
}

export default function EngagementTodoView({ engagementId, service }: EngagementTodoViewProps) {
    const [filter, setFilter] = useState<'all' | 'ACTION_REQUIRED' | 'ACTION_TAKEN' | 'COMPLETED'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>(undefined);
    
    const queryClient = useQueryClient();

    const { data: todos, isLoading } = useQuery({
        queryKey: ['engagement-todos', engagementId],
        enabled: !!engagementId,
        queryFn: () => todoService.list(engagementId!),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => todoService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-todos', engagementId] });
            toast.success("Todo deleted successfully");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to delete todo");
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: TodoListStatus }) => 
            todoService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-todos', engagementId] });
            toast.success("Status updated");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to update status");
        }
    });

    const filteredTodos = useMemo(() => {
        if (!todos) return [];
        if (filter === 'all') return todos;
        return todos.filter(t => t.status === filter);
    }, [todos, filter]);

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this todo?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (todo: Todo) => {
        setSelectedTodo(todo);
        setIsModalOpen(true);
    };

    const getStatusIcon = (status: TodoListStatus) => {
        switch (status) {
            case TodoListStatus.COMPLETED: return <CheckCircle2 size={16} className="text-green-500" />;
            case TodoListStatus.ACTION_TAKEN: return <Clock size={16} className="text-blue-500" />;
            default: return <AlertCircle size={16} className="text-amber-500" />;
        }
    };

    const getStatusLabel = (status: TodoListStatus) => {
        switch (status) {
            case TodoListStatus.COMPLETED: return "Completed";
            case TodoListStatus.ACTION_TAKEN: return "Action Taken";
            default: return "Action Required";
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 font-inter">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Engagement Todos</h2>
                    <p className="text-sm text-gray-500">Manage and track tasks for this engagement</p>
                </div>
                <Button 
                    onClick={() => {
                        setSelectedTodo(undefined);
                        setIsModalOpen(true);
                    }}
                    className="bg-primary text-white rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus size={20} className="mr-2" />
                    Create Todo
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <Filter size={16} className="text-gray-400 shrink-0" />
                {(['all', TodoListStatus.ACTION_REQUIRED, TodoListStatus.ACTION_TAKEN, TodoListStatus.COMPLETED] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold capitalize transition-all shrink-0 border",
                            filter === f 
                                ? "bg-gray-900 text-white border-gray-900 shadow-md" 
                                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                        )}
                    >
                        {f === 'all' ? 'All Tasks' : getStatusLabel(f)}
                    </button>
                ))}
            </div>

            {/* Todo List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredTodos.length > 0 ? (
                    filteredTodos.map((todo: Todo) => (
                        <ShadowCard key={todo.id} className="group relative overflow-hidden bg-white border border-gray-100 rounded-4xl hover:shadow-xl transition-all duration-300">
                            <div className="p-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={cn(
                                                "p-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider",
                                                todo.status === TodoListStatus.COMPLETED ? "bg-green-50 text-green-600" :
                                                todo.status === TodoListStatus.ACTION_TAKEN ? "bg-blue-50 text-blue-600" :
                                                "bg-amber-50 text-amber-600"
                                            )}>
                                                {getStatusIcon(todo.status)}
                                                {getStatusLabel(todo.status)}
                                            </div>
                                            {todo.type !== 'CUSTOM' && todo.moduleId && (
                                                <button 
                                                    onClick={() => {
                                                        const type = todo.type as string;
                                                        const tab = type === 'DOCUMENT_REQUEST' ? 'requests' : 
                                                                    type === 'REQUESTED_DOCUMENT' ? 'requests' : 
                                                                    type === 'FILING' ? 'filing' : 
                                                                    type === 'CHAT' ? 'chat' : 'dashboard';
                                                        window.location.href = `/engagement-view/${engagementId}?tab=${tab}`;
                                                    }}
                                                    className="px-2 py-1 bg-primary/5 text-primary hover:bg-primary/10 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                                                >
                                                    Next
                                                    <ExternalLink size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 truncate mb-1">{todo.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{todo.description || 'No description provided'}</p>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-400">
                                            {todo.deadline && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} />
                                                    Due {format(new Date(todo.deadline), 'MMM dd, yyyy')}
                                                </div>
                                            )}
                                            {todo.createdBy && (
                                                <div className="flex items-center gap-1.5">
                                                    <User size={14} />
                                                    By {todo.createdBy.user?.firstName} {todo.createdBy.user?.lastName}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleEdit(todo)}
                                                className="h-8 w-8 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-primary"
                                            >
                                                <Pencil size={14} />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDelete(todo.id)}
                                                className="h-8 w-8 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                        
                                        {todo.status !== TodoListStatus.COMPLETED && (
                                            <Button
                                                onClick={() => statusMutation.mutate({ 
                                                    id: todo.id, 
                                                    status: todo.status === TodoListStatus.ACTION_REQUIRED ? TodoListStatus.ACTION_TAKEN : TodoListStatus.COMPLETED 
                                                })}
                                                className={cn(
                                                    "h-9 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    todo.status === TodoListStatus.ACTION_REQUIRED 
                                                        ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20" 
                                                        : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20"
                                                )}
                                            >
                                                {todo.status === TodoListStatus.ACTION_REQUIRED ? "Mark as Done" : "Complete Task"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ShadowCard>
                    ))
                ) : (
                    <ShadowCard className="p-12 text-center rounded-[2.5rem] bg-gray-50/50 border-dashed border-2 border-gray-200">
                        <div className="mb-4 flex justify-center">
                            <div className="p-4 bg-white rounded-full text-gray-300">
                                <Plus size={32} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Todos Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">There are no tasks assigned to this engagement {filter !== 'all' && 'matching the current filter'}.</p>
                        {filter === 'all' && (
                            <Button 
                                onClick={() => setIsModalOpen(true)}
                                variant="ghost" 
                                className="mt-4 text-primary font-bold hover:bg-transparent hover:underline"
                            >
                                Create your first todo
                            </Button>
                        )}
                    </ShadowCard>
                )}
            </div>

            {/* Todo Modal */}
            <TodoModal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedTodo(undefined);
                }}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['engagement-todos', engagementId] });
                }}
                engagementId={engagementId!}
                service={service}
                initialData={selectedTodo}
                mode={selectedTodo ? "edit" : "create"}
            />
        </div>
    );
}
