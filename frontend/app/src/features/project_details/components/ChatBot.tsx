import React, {useLayoutEffect, useMemo, useRef, useState} from "react";
import {Bot, BrushCleaning, Loader2, Send, Sparkles, X} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import {useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {ChatService, type Message} from "@/shared/services";
import type {ProjectDetailResponse} from "@/shared/types";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {useAuthStore} from "@/store";
import {QUERY_STALE_TIME} from "@/utils";
import {format} from "date-fns";
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/vs2015.css';
import toast from "react-hot-toast";

interface ChatBotProps {
    project: ProjectDetailResponse
}

export const ChatBot: React.FC<ChatBotProps> = ({project}) => {
    const memberIds = useMemo(() => {
        return project.members.map(m => m.userId);
    }, [project]);
    const userId = useAuthStore(state => state.userInfo!.userId);
    const queryClient = useQueryClient();

    const [newMessages, setNewMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isOpen, setIsOpen] = useState(false); // Quản lý state mở/đóng để xử lý UX tốt hơn

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['chatHistory', project.projectId, userId],
        queryFn: ({pageParam}) => ChatService.getChatHistory(project.projectId, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (!lastPage || lastPage.length === 0) return undefined;
            return lastPage[0].createdAt;
        },
        enabled: !!project.projectId,
        staleTime: QUERY_STALE_TIME.VERY_LONG,
        gcTime: QUERY_STALE_TIME.VERY_LONG
    });

    const allMessages = useMemo(() => {
        const history = data?.pages
            ? [...data.pages].reverse().flatMap(page => page)
            : [];

        if (history.length === 0 && newMessages.length === 0) {
            return [{
                id: '1',
                content: "Tôi là trợ lý AI dự án. Bạn cần trợ giúp gì?",
                role: 'assistant',
                createdAt: new Date().toISOString()
            }];
        }
        return [...history, ...newMessages];
    }, [data, newMessages]);

    const chatMutation = useMutation({
        mutationFn: (msg: string) => ChatService.chat(project.projectId, {
            body: msg,
            memberIds: memberIds,
        }),
        onSuccess: (data) => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                content: data,
                role: 'assistant',
                createdAt: new Date().toString()
            };
            setNewMessages(prev => [...prev, botMsg]);
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });
    const deleteChat = useMutation({
        mutationFn: () => ChatService.deleteChat(project.projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:['chatHistory', project.projectId, userId]});
            setNewMessages([{
                id: '1',
                content: "Tôi là trợ lý AI dự án. Bạn cần trợ giúp gì?",
                role: 'assistant',
                createdAt: new Date().toISOString()
            }]);
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    useLayoutEffect(() => {
        if (!scrollContainerRef.current) return;

        if (isFetchingNextPage && prevScrollHeightRef.current > 0) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
        } else if (newMessages.length > 0 && !isFetchingNextPage) {
            messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
        }
    }, [data, isFetchingNextPage, newMessages.length]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const {scrollTop, scrollHeight} = e.currentTarget;
        if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
            prevScrollHeightRef.current = scrollHeight;
            fetchNextPage();
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;
        const userMsg: Message = {
            id: Date.now().toString(),
            content: inputValue,
            role: 'user',
            createdAt: new Date().toString()
        };
        setNewMessages(prev => [...prev, userMsg]);
        chatMutation.mutate(inputValue);
        setInputValue("");
    };

    return (
        <Popover.Root
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (open) {
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({behavior: "instant"});
                    }, 0);
                }
            }}
        >
            <Popover.Trigger asChild>
                <div className="group fixed bottom-4 right-4 md:bottom-6 md:right-6 z-10">
                    <div className="relative">
                        <div className="hidden md:group-hover:block bg-white p-2 rounded shadow-xl border
                                border-gray-200 absolute w-max -top-10 right-0
                                transition-all duration-300 animate-in fade-in slide-in-from-bottom-2
                                opacity-0 group-hover:opacity-100 after:content-[''] after:absolute
                                after:top-full after:right-5 after:border-8 after:border-transparent after:border-t-white">
                            <div className="text-xs font-semibold text-gray-600">
                                Xin chào. Tôi là trợ lý AI dự án
                            </div>
                        </div>
                        <button
                            className={`p-3 rounded-full border shadow-lg active:scale-95 transition-all
                                ${isOpen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700'}
                            `}
                        >
                            {isOpen ? <X className="h-6 w-6"/> : <Bot className="h-6 w-6"/>}
                        </button>
                    </div>
                </div>
            </Popover.Trigger>

            <Popover.PopoverPortal>
                <Popover.Content
                    className="
                        z-50 rounded bg-white shadow-2xl border border-gray-300
                        outline-none overflow-hidden flex flex-col
                        w-[calc(100vw-32px)] h-[75vh]
                        max-w-2xl
                        data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2
                        data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95
                    "
                    side="top"
                    align="end"
                    sideOffset={10}
                    avoidCollisions={true}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div
                        className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900 text-white">
                        <span className="font-semibold flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-400"/>
                            Trợ lý AI
                        </span>
                        <div className="flex items-center gap-2">
                            <button title={"Clear chat"}
                                    className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-800"
                                    onClick={()=>deleteChat.mutate()}>
                                <BrushCleaning size={20}/>
                            </button>
                            <Popover.Close asChild>
                                <button
                                    className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-gray-800">
                                    <X size={20}/>
                                </button>
                            </Popover.Close>
                        </div>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 scrollbar-thin relative"
                    >
                        {isFetchingNextPage && (
                            <div
                                className="flex justify-center py-2 absolute top-0 left-0 w-full z-10 pointer-events-none">
                                <div className="bg-white/80 p-1 rounded-full shadow-sm backdrop-blur-sm">
                                    <Loader2 className="animate-spin text-blue-500 w-4 h-4"/>
                                </div>
                            </div>
                        )}

                        {allMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex w-full ${
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                <div className={`
                                        relative p-3 shadow-sm text-sm
                                        ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm max-w-[85%]'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-sm w-full md:max-w-[90%]'
                                }
                                `}>
                                    {msg.role === 'assistant' ? (
                                        <>
                                            <div className="flex items-center mb-2 gap-2">
                                                <div className="p-1 bg-blue-100 rounded-full">
                                                    <Sparkles size={12} className="text-blue-600"/>
                                                </div>
                                                <span
                                                    className="text-xs font-semibold text-gray-500">AI Assistant</span>
                                            </div>
                                            <div className="prose prose-sm max-w-none
                                                            prose-pre:whitespace-pre-wrap prose-pre:bg-gray-800 prose-pre:text-gray-100
                                                            prose-code:text-xs md:prose-code:text-sm">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    rehypePlugins={[rehypeHighlight]}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </>
                                    ) : (<div>{msg.content}</div>)}

                                    <div className={`text-[10px] mt-1 text-right ${
                                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {chatMutation.isPending && (
                            <div className="flex w-full justify-start">
                                <div
                                    className="bg-white p-3 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm flex items-center gap-2">
                                    <Loader2 size={16} className="text-blue-600 animate-spin"/>
                                    <span className="text-xs text-gray-500">Đang trả lời...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef}/>
                    </div>

                    {/* Footer Input */}
                    <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex items-center gap-2 transition-all"
                        >
                            <textarea
                                rows={1}
                                autoFocus={false}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Nhập câu hỏi..."
                                className="flex-1 bg-gray-100 rounded p-2 outline-none ring-0
                                           md:text-sm text-gray-700 placeholder-gray-400
                                           resize-none scrollbar-none"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || chatMutation.isPending}
                                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700
                                           disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors
                                           flex items-center justify-center h-[44px] w-[44px]"
                            >
                                {chatMutation.isPending ? <Loader2 size={18} className="animate-spin"/> :
                                    <Send size={18}/>}
                            </button>
                        </form>
                    </div>
                </Popover.Content>
            </Popover.PopoverPortal>
        </Popover.Root>
    )
}