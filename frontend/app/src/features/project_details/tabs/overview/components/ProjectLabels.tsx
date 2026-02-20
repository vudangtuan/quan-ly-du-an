import type {LabelResponse, ProjectDetailResponse} from "@/shared/types";
import React from "react";
import {Edit2, Plus, Tag} from "lucide-react";
import {LabelBadge} from "@/shared/components";
import {LabelPopover} from "../components";
import {useLabel} from "../hooks";


interface ProjectLabelsProps {
    project: ProjectDetailResponse,
}

export const ProjectLabels: React.FC<ProjectLabelsProps> = ({project}) => {
    const {createLabelMutation} = useLabel(project.projectId);
    return (
        <div className={"bg-white border border-gray-200 rounded-xl shadow-sm"}>
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b
            border-gray-200 flex justify-between items-center">
                <h3 className={"text-base font-semibold text-gray-900 flex items-center gap-2"}>
                    Nhãn dự án
                </h3>
                {
                    <LabelPopover title={"Thêm nhãn"}
                                  label={{
                                      name: "",
                                      color: "#3B82F6",
                                  }}
                                  onSubmit={(label, onSuccess) => {
                                      createLabelMutation.mutate(label, {
                                          onSuccess
                                      });

                                  }}
                                  isLoadingSubmit={createLabelMutation.isPending}
                    >
                        <button
                            className={"hover:bg-blue-100 transition-colors p-2 rounded-full cursor-pointer group"}
                            title={"Thêm nhãn"}>
                            <Plus className={"h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors"}/>
                        </button>
                    </LabelPopover>
                }
            </div>
            <div className="p-5 space-y-1.5">
                {project.labels.length === 0 ? (
                    <div className="text-center py-6">
                        <div
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mb-2">
                            <Tag className="h-5 w-5 text-gray-400"/>
                        </div>
                        <p className="text-sm text-gray-500">Chưa có nhãn nào</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {project.labels.map((l: LabelResponse) => (
                            <ItemLabel
                                key={l.labelId}
                                label={l}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface ItemLabelProps {
    label: LabelResponse,
}

const ItemLabel: React.FC<ItemLabelProps> = ({label}) => {
    const {updateLabelMutation, deleteLabelMutation} = useLabel(label.projectId);
    return (
        <div className="group hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{backgroundColor: `${label.color}20`}}
                    >
                        <Tag className="h-3.5 w-3.5" style={{color: label.color}}/>
                    </div>
                    <LabelBadge label={label}/>
                </div>

                {(
                    <LabelPopover
                        label={label}
                        title={"Chỉnh sửa nhãn"}
                        onSubmit={(updateLabel, onSuccess) => {
                            updateLabelMutation.mutate({
                                data: updateLabel,
                                labelId: label.labelId
                            }, {onSuccess});
                        }}
                        onDelete={(onSuccess) => {
                            deleteLabelMutation.mutate(label.labelId, {onSuccess});
                        }}
                        isLoadingSubmit={updateLabelMutation.isPending}
                        isLoadingDelete={deleteLabelMutation.isPending}
                    >
                        <button
                            className="md:opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all"
                            title="Chỉnh sửa"
                        >
                            <Edit2 className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700"/>
                        </button>
                    </LabelPopover>
                )}
            </div>
        </div>
    );
}