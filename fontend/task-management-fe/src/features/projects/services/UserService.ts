import type {PaginatedResponse} from "../types/project.types";
import {UserInfo} from "@features/auth/types/auth.types";
import {privateApi} from "@config/api.config";


export const UserService = {
    searchUsers: async (page?: number, size?: number, text: string = ""):
        Promise<PaginatedResponse<UserInfo>> => {
        return await privateApi.get("/user",{
            params:{
                page,size,text
            }
        })
    },
    updateName: async (name: string): Promise<UserInfo> => {
        return await privateApi.patch(`/user/name`, {},{
            params: {
                name: name
            }
        })
    }
}