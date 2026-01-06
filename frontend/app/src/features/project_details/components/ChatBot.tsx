import React, {useLayoutEffect, useMemo, useRef, useState} from "react";
import {Bot, Loader2, Send, Sparkles} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import {useInfiniteQuery, useMutation} from "@tanstack/react-query";
import {ChatService, type Message} from "@/shared/services";
import type {ProjectDetailResponse} from "@/shared/types";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {useAuthStore} from "@/store";
import {QUERY_STALE_TIME} from "@/utils";
import {format} from "date-fns";
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/vs2015.css';

interface ChatBotProps {
    project: ProjectDetailResponse
}

export const ChatBot: React.FC<ChatBotProps> = ({project}) => {
    const memberIds = useMemo(() => {
        return project.members.map(m => m.userId);
    }, [project]);
    const userId = useAuthStore(state => state.userInfo!.userId);


    const [newMessages, setNewMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");


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
        }
    });

    useLayoutEffect(() => {
        if (!scrollContainerRef.current) return;

        // Nếu load tin cũ: Giữ thanh cuộn đứng yên
        if (isFetchingNextPage && prevScrollHeightRef.current > 0) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
        }
        // Nếu có tin mới: Scroll xuống đáy
        else if (newMessages.length > 0 && !isFetchingNextPage) {
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
        <Popover.Root modal onOpenChange={open => {
            if (open) {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({behavior: "instant"});
                }, 0);
            }
        }}>
            <Popover.Trigger asChild>
                <div className="group fixed bottom-6 right-6 z-50">
                    <div className={"relative"}>
                        <div className="bg-white p-2 rounded shadow-xl border group-hover:block
                                border-gray-200 absolute w-max -top-10 right-0
                                transition-all duration-300 animate-in fade-in slide-in-from-bottom-2
                                hidden after:content-[''] after:absolute after:top-full after:right-5
                                after:border-8 after:border-transparent after:border-t-white">
                            <div className="text-xs font-semibold text-gray-600">
                                Xin chào. Tôi là trợ lý AI dự án
                            </div>
                        </div>
                        <button
                            className=" p-3 rounded-full bg-white border border-gray-200 shadow-lg hover:bg-gray-100 active:scale-95">
                            <Bot className="h-8 w-8"/>
                        </button>
                    </div>
                </div>
            </Popover.Trigger>

            <Popover.PopoverPortal>
                <Popover.Content
                    className="w-xl rounded bg-white shadow-2xl border border-gray-300
                               outline-none overflow-hidden flex flex-col h-[400px]
                               data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2
                               data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
                    side="top" align="end" sideOffset={5}
                >
                    {/* Body List Tin nhắn */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-4 bg-gray-200 space-y-5 scrollbar-thin relative" // Thêm relative
                    >
                        {isFetchingNextPage && (
                            <div className="flex justify-center py-2 absolute top-0 left-0 w-full z-10">
                                <Loader2 className="animate-spin text-gray-500 w-4 h-4"/>
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
                                        relative p-2 shadow-sm text-sm
                                        ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded max-w-[85%]'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded w-full'
                                }
                                `}>
                                    {msg.role === 'assistant' ? (
                                        <>
                                            <div className="flex items-center mb-1">
                                                <div className="p-1 bg-blue-100 rounded-full">
                                                    <Sparkles size={12} className="text-blue-600"/>
                                                </div>
                                            </div>
                                            <div className="prose prose-sm max-w-none prose-pre:whitespace-pre-wrap
                                                            prose-pre:text-sm prose-pre:break-words
                                                            prose-code:text-sm">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    rehypePlugins={[rehypeHighlight]}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </>
                                    ) : (<div>{msg.content}</div>)}

                                    <div className={`text-[10px] text-right ${
                                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading khi đang chat */}
                        {chatMutation.isPending && (
                            <div className="flex w-full justify-start">
                                <div
                                    className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm w-full flex items-center gap-3">
                                    <div className="p-1.5 bg-gray-100 rounded-full animate-spin">
                                        <Loader2 size={16} className="text-blue-600"/>
                                    </div>
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
                            className="flex items-center gap-2 p-1 transition-all"
                        >
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Nhập câu hỏi..."
                                className="flex-1 bg-transparent p-2 outline-none text-sm text-gray-700 placeholder-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || chatMutation.isPending}
                                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                            >
                                <Send size={16}/>
                            </button>
                        </form>
                    </div>
                </Popover.Content>
            </Popover.PopoverPortal>
        </Popover.Root>
    )
}