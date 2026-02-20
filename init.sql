CREATE
DATABASE user_db;
CREATE
DATABASE core_db;
CREATE
DATABASE ai_db;
\c user_db
create table users
(
    user_id           varchar primary key,
    email             varchar unique not null,
    password_hash     varchar,
    full_name         varchar        not null,
    oauth_provider    varchar        not null,
    oauth_provider_id varchar unique not null,
    status            varchar        not null default 'ACTIVE',
    role              varchar        not null default 'USER',
    created_at        timestamptz             default now(),
    updated_at        timestamptz,

    constraint users_oauth_provider_check
        check ( oauth_provider in ('GOOGLE', 'GITHUB', 'FACEBOOK')),
    constraint users_role_check
        check ( role in ('USER', 'ADMIN')),
    constraint users_status_check
        check ( status in ('ACTIVE', 'DELETED', 'SUSPENDED'))
);

create index idx_fullname on users (full_name);

INSERT INTO users (user_id,
                   email,
                   password_hash,
                   full_name,
                   oauth_provider,
                   oauth_provider_id,
                   status,
                   role,
                   created_at,
                   updated_at)
VALUES (gen_random_uuid()::text,
        'admin@quanlynhiemvu.online',
        '$2a$10$rGA5VWzTTBTqP.jLXEZBxO4HoedCmnAiB2mv9V9V2JTkkK/ezo5k.',
        'ADMIN',
        'GOOGLE',
        '10042003',
        'ACTIVE',
        'ADMIN',
        NOW(),
        NOW());


\c ai_db
CREATE
EXTENSION IF NOT EXISTS vector;

\c core_db
    CREATE
EXTENSION IF NOT EXISTS citext;

create table projects
(
    project_id  varchar primary key,
    name        varchar not null,
    description text,
    status      varchar,
    creator_id  varchar not null,
    due_at      timestamptz,
    created_at  timestamptz default now(),
    updated_at  timestamptz,
    archived_at timestamptz,

    constraint projects_status_check
        check ( status in ('ACTIVE', 'ARCHIVED'))
);
create index idx_creator_id on projects (creator_id);


create table labels
(
    label_id   varchar primary key,
    color      varchar,
    name       varchar not null,
    project_id varchar references projects (project_id) on delete cascade,
    constraint uk_project_label_name unique (project_id, name)
);
create index idx_label_project_id on labels (project_id);

create table board_columns
(
    board_column_id varchar primary key,
    name            citext not null,
    sort_order      double precision,
    status          varchar default 'ACTIVE',
    archived_at     timestamptz,
    project_id      varchar references projects (project_id) on delete cascade,

    constraint uk_projectid_name unique (name, project_id),
    constraint uk_projectid_sort unique (sort_order, project_id),

    constraint board_columns_status_check check ( status in ('ACTIVE', 'ARCHIVED'))
);
create index idx_projectid on board_columns (project_id);


create table project_members
(
    member_id  varchar,
    project_id varchar references projects (project_id) on delete cascade,
    email      varchar not null,
    joined_at  timestamptz,
    role       varchar,

    primary key (member_id, project_id),
    constraint project_members_role_check check ( role in ('OWNER', 'ADMIN', 'MEMBER', 'OBSERVER'))
);

create table tasks
(
    task_id         varchar primary key,
    title           varchar not null,
    description     text,
    status          varchar     default 'ACTIVE',
    priority        varchar     default 'LOW',
    completed       boolean     default false,
    due_at          timestamptz,
    archived_at     timestamptz,
    created_at      timestamptz default now(),
    updated_at      timestamptz,
    creator_id      varchar not null,
    sort_order      double precision,
    project_id      varchar references projects (project_id) on delete cascade,
    board_column_id varchar references board_columns (board_column_id) on delete cascade,
    constraint uk_board_column_sort unique (board_column_id, sort_order)
);
create index idx_project_id on tasks (project_id);

create table task_labels
(
    label_id varchar not null references labels (label_id) on delete cascade,
    task_id  varchar not null references tasks (task_id) on delete cascade,
    primary key (label_id, task_id)
);

create table task_assignee
(
    assignee_id varchar not null,
    task_id     varchar not null references tasks (task_id) on delete cascade ,
    join_at     timestamptz default now(),

    primary key (assignee_id, task_id)
);

create table comments
(
    comment_id varchar primary key,
    body       text    not null,
    created_at timestamptz default now(),
    creator_id varchar not null,
    task_id    varchar references tasks (task_id) on delete cascade,
    updated_at timestamptz
);
create index idx_comment_task_id on comments (task_id);

create table comment_mentions
(
    comment_id varchar not null references comments (comment_id) on delete cascade,
    mention_id varchar not null,
    primary key (mention_id, comment_id)
);

create table check_list
(
    check_list_id varchar primary key,
    body          varchar,
    created_at    timestamptz default now(),
    creator_id    varchar not null,
    done          boolean     default false,
    task_id       varchar not null references tasks (task_id) on delete cascade,
    updated_at    timestamptz,

    constraint uk_checklist_task_id_body unique (body, task_id)
);
create index idx_checklist_task_id on check_list (task_id);