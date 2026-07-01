create table answer_record
(
    id             int auto_increment
        primary key,
    exam_record_id int                                 not null,
    question_id    int                                 not null,
    user_answer    text                                null comment '用户答案',
    score          int       default 0                 null comment '分数',
    is_correct     int       default 0                 null comment '是否正确',
    ai_correction  text                                null comment 'ai校正',
    create_time    timestamp default CURRENT_TIMESTAMP null comment '创建时间',
    update_time    timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted     tinyint   default 0                 not null comment '0-未删除，1-已删除'
)
    comment '答案记录' row_format = DYNAMIC;

create table banners
(
    id          bigint auto_increment comment '轮播图ID'
        primary key,
    title       varchar(255)                         not null comment '轮播图标题',
    description text                                 null comment '轮播图描述',
    image_url   varchar(500)                         not null comment '图片URL',
    link_url    varchar(500)                         null comment '跳转链接',
    sort_order  int        default 0                 null comment '排序顺序',
    is_active   tinyint(1) default 1                 null comment '是否启用',
    create_time timestamp  default CURRENT_TIMESTAMP null comment '创建时间',
    update_time timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted  tinyint    default 0                 not null comment '0-未删除，1-已删除'
)
    comment '轮播图表' row_format = DYNAMIC;

create index idx_is_active
    on banners (is_active);

create index idx_sort_order
    on banners (sort_order);

create table categories
(
    id          bigint auto_increment
        primary key,
    name        varchar(100)                        not null,
    parent_id   bigint    default 0                 null,
    sort        int       default 0                 null,
    create_time timestamp default CURRENT_TIMESTAMP null comment '创建时间',
    update_time timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted  tinyint   default 0                 not null comment '0-未删除，1-已删除'
)
    row_format = DYNAMIC;

create table exam_records
(
    id              int auto_increment
        primary key,
    exam_id         int                                   not null,
    student_name    varchar(50)                           not null,
    score           int         default 0                 null,
    answers         text                                  null comment '答案',
    start_time      timestamp                             null,
    end_time        timestamp                             null,
    status          varchar(20) default 'ONGOING'         null,
    window_switches int         default 0                 null comment '窗口切换',
    create_time     timestamp   default CURRENT_TIMESTAMP null comment '创建时间',
    update_time     timestamp   default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted      tinyint     default 0                 not null comment '0-未删除，1-已删除'
)
    comment '考试记录' row_format = DYNAMIC;

create table notices
(
    id          bigint auto_increment comment '公告ID'
        primary key,
    title       varchar(255)                          not null comment '公告标题',
    content     text                                  not null comment '公告内容',
    type        varchar(20) default 'NOTICE'          null comment '公告类型：SYSTEM(系统)、FEATURE(新功能)、NOTICE(通知)',
    priority    int         default 0                 null comment '优先级：0-普通，1-重要，2-紧急',
    is_active   tinyint(1)  default 1                 null comment '是否启用',
    create_time timestamp   default CURRENT_TIMESTAMP null comment '创建时间',
    update_time timestamp   default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted  tinyint     default 0                 not null comment '0-未删除，1-已删除'
)
    comment '公告表' row_format = DYNAMIC;

create index idx_create_time
    on notices (create_time);

create index idx_is_active
    on notices (is_active);

create index idx_priority
    on notices (priority);

create index idx_type
    on notices (type);

create table paper
(
    id             int auto_increment
        primary key,
    name           varchar(100)                             not null,
    description    text                                     null,
    status         varchar(20)    default 'DRAFT'           null,
    total_score    decimal(10, 2) default 0.00              null comment '总分',
    question_count int            default 0                 null,
    duration       int                                      not null,
    create_time    timestamp      default CURRENT_TIMESTAMP null comment '创建时间',
    update_time    timestamp      default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted     tinyint        default 0                 not null comment '0-未删除，1-已删除'
)
    row_format = DYNAMIC;

create table paper_question
(
    id          int auto_increment
        primary key,
    paper_id    int                                 not null,
    question_id bigint                              not null,
    score       decimal(10, 2)                      not null,
    create_time timestamp default CURRENT_TIMESTAMP null comment '创建时间',
    update_time timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted  tinyint   default 0                 null comment '0-未删除，1-已删除'
)
    row_format = DYNAMIC;

create table question_answers
(
    id          bigint auto_increment
        primary key,
    question_id bigint                              not null,
    answer      text                                not null,
    keywords    text                                null,
    create_time timestamp default CURRENT_TIMESTAMP null comment '创建时间',
    update_time timestamp default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted  tinyint   default 0                 not null comment '0-未删除，1-已删除'
)
    row_format = DYNAMIC;

create table question_choices
(
    id          bigint auto_increment
        primary key,
    question_id bigint                               not null,
    content     text                                 not null,
    is_correct  tinyint(1) default 0                 null,
    sort        int        default 0                 null,
    create_time timestamp  default CURRENT_TIMESTAMP null comment '创建时间',
    update_time timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted  tinyint    default 0                 not null comment '0-未删除，1-已删除'
)
    row_format = DYNAMIC;

create table questions
(
    id          bigint auto_increment
        primary key,
    title       text                                 not null,
    type        varchar(20)                          not null,
    multi       tinyint(1) default 0                 null,
    category_id bigint                               not null,
    difficulty  varchar(10)                          not null,
    score       int        default 5                 null,
    analysis    text                                 null,
    create_time timestamp  default CURRENT_TIMESTAMP null comment '创建时间',
    update_time timestamp  default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment '更新时间',
    is_deleted  tinyint    default 0                 not null comment '0-未删除，1-已删除'
)
    row_format = DYNAMIC;

