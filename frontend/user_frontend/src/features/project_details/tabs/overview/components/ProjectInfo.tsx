import React, {useMemo} from "react";
import {AlignLeft, Calendar, Clock, Edit, FileText, User, X, Check, Loader2} from "lucide-react";
import {formatDate, isOverdue} from "@/utils";
import type {ProjectDetailResponse} from "@/shared/types";
import DatePicker from "react-datepicker";
import {useUpdateInfoProject} from "../hooks";


interface ProjectInfoProps {
    project: ProjectDetailResponse
}


export const ProjectInfo: React.FC<ProjectInfoProps> = ({project}) => {
    const isOverdueProject = useMemo(() => {
        return isOverdue(project.dueAt);
    }, [project.dueAt]);

    const {
        editedProject, isEditing, handleEdit,
        handleCancel, updateProjectMutation,
        handleSetData
    } = useUpdateInfoProject(project);

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r flex justify-between
             from-blue-50 to-indigo-50 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center">
                        Thông tin dự án
                    </h3>
                    {
                        project.currentRoleInProject === "OWNER" && (
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            disabled={updateProjectMutation.isPending}
                                            className="hover:bg-green-100 transition-colors p-2 rounded-full cursor-pointer"
                                            title="Lưu thay đổi"
                                            onClick={() => {
                                                updateProjectMutation.mutate();
                                            }}
                                        >
                                            {
                                                updateProjectMutation.isPending ?
                                                    <Loader2 className="h-5 w-5 text-green-600 animate-spin"/> :
                                                    <Check className="h-5 w-5 text-green-600"/>}
                                        </button>
                                        <button
                                            className="hover:bg-red-100 transition-colors p-2 rounded-full cursor-pointer"
                                            title="Hủy"
                                            onClick={handleCancel}
                                        >
                                            <X className="h-5 w-5 text-red-600"/>
                                        </button>
                                    </>
                                ) : (
                                    <div
                                        className="hover:bg-blue-100 transition-colors p-2 rounded-full cursor-pointer"
                                        title="Chỉnh sửa thông tin"
                                        onClick={handleEdit}
                                    >
                                        <Edit className="h-5 w-5 cursor-pointer"/>
                                    </div>
                                )}
                            </div>
                        )
                    }
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">

                    {/* 1. Tên dự án */}
                    <div className="group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg mt-0.5 group-hover:bg-blue-100 transition-colors">
                                <FileText className="h-4 w-4 text-blue-600"/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500 mb-1">Tên dự án</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedProject.name}
                                        onChange={(e) => handleSetData({name: e.target.value})}
                                        className="w-full text-sm font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-gray-900">
                                        {project.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Mô tả */}
                    <div className="group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                        <div className="flex items-start gap-3">
                            <div
                                className="p-2 bg-purple-50 rounded-lg mt-0.5 group-hover:bg-purple-100 transition-colors">
                                <AlignLeft className="h-4 w-4 text-purple-600"/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-500 mb-1">Mô tả</p>
                                {isEditing ? (
                                    <textarea
                                        value={editedProject.description}
                                        onChange={(e) => handleSetData({
                                            description: e.target.value
                                        })}
                                        rows={4}
                                        className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        placeholder="Nhập mô tả dự án..."
                                    />
                                ) : (
                                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                        {project.description || (
                                            <span className="italic text-gray-400">Không có mô tả</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-4"></div>

                    {/* 3. Người tạo */}
                    <div className="group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                                <User className="h-4 w-4 text-green-600"/>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 mb-0.5">Người tạo</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {project.creator.fullName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Ngày tạo */}
                    <div className="group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                                <Clock className="h-4 w-4 text-amber-600"/>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 mb-0.5">Ngày tạo</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {formatDate(project.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 5. Ngày hết hạn */}
                    <div className="group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg mt-0.5 group-hover:opacity-90 transition-colors ${
                                isOverdueProject ? 'bg-red-50 group-hover:bg-red-100' : 'bg-indigo-50 group-hover:bg-indigo-100'
                            }`}>
                                <Calendar
                                    className={`h-4 w-4 ${isOverdueProject ? 'text-red-600' : 'text-indigo-600'}`}/>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-500 mb-0.5">Hạn hoàn thành</p>
                                {isEditing ? (
                                    <DatePicker
                                        className={"text-sm font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"}
                                        isClearable
                                        minDate={new Date()}
                                        selected={editedProject.dueAt ? new Date(editedProject.dueAt) : null}
                                        onChange={(date) => handleSetData({
                                            dueAt: date ? date.toLocaleString() : null
                                        })}
                                        placeholderText={"Chọn ngày"}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm font-medium ${
                                            isOverdueProject ? 'text-red-600' : 'text-gray-900'
                                        }`}>
                                            {formatDate(project.dueAt)}
                                        </p>
                                        {isOverdueProject && (
                                            <span
                                                className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                            Quá hạn
                                        </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};