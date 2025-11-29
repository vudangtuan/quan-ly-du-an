import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation} from '@tanstack/react-query';
import { ProjectService } from '@features/projects/services/ProjectService';
import { Loader2, XCircle } from 'lucide-react';
import {ProjectMemberResponse} from "@features/projects/types/project.types";

export const AcceptInvitePage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const acceptMutation = useMutation({
        mutationFn: (t: string) => ProjectService.acceptInvitation(t),
        onSuccess: (data:ProjectMemberResponse) => {
            navigate(`/projects/${data.projectId}`);
        }
    });

    useEffect(() => {
        const token = searchParams.get('token');
        if(token){
            acceptMutation.mutate(token);
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-100">
                {acceptMutation.isPending && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                        <h2 className="text-xl font-semibold text-gray-900">Đang xử lý lời mời...</h2>
                        <p className="text-gray-500">Vui lòng đợi trong giây lát</p>
                    </div>
                )}

                {acceptMutation.isError && (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Có lỗi xảy ra</h2>
                        <p className="text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
                            {acceptMutation.error?.message || "Lời mời không hợp lệ hoặc đã hết hạn."}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Về trang chủ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};