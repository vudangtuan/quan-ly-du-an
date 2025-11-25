package com.tuanhust.coreservice.dto;

public enum ActionType {
    //owner action
    CREATE_PROJECT,
    UPDATE_PROJECT,
    DELETE_PROJECT,
    ARCHIVE_PROJECT,
    RESTORE_PROJECT,

    ADD_MEMBER,
    DELETE_MEMBER,
    UPDATE_ROLE,

    //member action
    CREATE_TASK,
    UPDATE_TASK,
    DELETE_TASK,
    MOVE_TASK,
    ARCHIVE_TASK,
    RESTORE_TASK,

    COMPLETE_TASK,

    ADD_COMMENT,
    UPDATE_COMMENT,
    DELETE_COMMENT,

    ADD_CHECKLIST,
    UPDATE_CHECKLIST,
    DELETE_CHECKLIST,
}
