import type {ProjectDetailResponse, ProjectMemberResponse, ProjectRole} from "@/shared/types";
import React from "react";
import {Mail, MoreVertical, UserPlus, X} from "lucide-react";
import {Avatar, Menu} from "@/shared/components";
import {useProjectMember} from "../hooks";
import {MemberInvitationFormDialog, OptionRole, RoleBadge} from "../components";
import {useAuthStore} from "@/store";

interface ProjectMemberProps {
    project: ProjectDetailResponse
}

export const ProjectMember: React.FC<ProjectMemberProps> = ({project}) => {
    const userId = useAuthStore(state => state.userInfo!.userId);
    return (
        <div className={"bg-white border border-gray-200 rounded-xl shadow-sm"}>
            <div className="px-5 py-4 bg-gradient-to-r flex justify-between
                            from-blue-50 to-indigo-50 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                    Thành viên
                </h3>
                {
                    <MemberInvitationFormDialog projectId={project.projectId}>
                        <button
                            className={"hover:bg-blue-100 transition-colors p-2 rounded-full cursor-pointer group"}
                            title={"Thêm thành viên"}>
                            <UserPlus className={"h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors"}/>
                        </button>
                    </MemberInvitationFormDialog>
                }
            </div>
            <div className="p-5 space-y-3">
                {
                    project.members.map((m) => (
                        <ItemMember key={m.userId} member={m}
                                    canManage={m.userId !== userId}/>
                    ))
                }
            </div>
        </div>
    )
}

interface ItemMemberProps {
    member: ProjectMemberResponse;
    canManage: boolean
}

const ItemMember: React.FC<ItemMemberProps> = ({member, canManage}) => {
    const {
        isEditingRole, setIsEditingRole,
        updateRoleMutation, menuItems,
        selectedRole, setSelectedRole
    } = useProjectMember(member);

    return (
        <div className={"group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors cursor-default"}>
            <Menu items={menuItems} enableContextMenu={canManage} enableDropdown={canManage}
                  trigger={
                      <div hidden={!canManage}
                           className={"absolute right-2 top-3.5 group-hover:opacity-100 md:opacity-0 transition-opacity duration-200"}>
                          <MoreVertical className={"h-4 w-4 text-gray-400 hover:text-gray-600"}/>
                      </div>
                  }>
                <div className={"flex gap-3 items-center justify-between"}>
                    <div>
                        <Avatar userId={member.userId} fullName={member.fullName}/>
                    </div>
                    <div className={"flex flex-col justify-center min-w-0 flex-1"}>
                        <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate text-sm">
                                        {member.fullName}
                        </span>
                            <RoleBadge role={member.roleInProject}/>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail className="h-3 w-3 flex-shrink-0"/>
                            <span className="truncate">{member.email}</span>
                        </div>
                    </div>
                </div>
            </Menu>
            {isEditingRole && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg border
                     border-gray-200 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Chỉnh sửa vai trò</h4>
                        <button
                            onClick={() => setIsEditingRole(false)}
                            disabled={updateRoleMutation.isPending}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded p-1 transition-colors disabled:opacity-50"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                    <OptionRole selectedRole={selectedRole as Exclude<ProjectRole, "OWNER">}
                                setSelectedRole={setSelectedRole}/>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => {
                                updateRoleMutation.mutate();
                            }}
                            disabled={updateRoleMutation.isPending || selectedRole === member.roleInProject}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {updateRoleMutation.isPending ? (
                                <>
                                    <div
                                        className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                    Đang lưu...
                                </>
                            ) : (
                                "Lưu"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
