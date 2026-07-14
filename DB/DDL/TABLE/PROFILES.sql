/*
ログインユーザを登録するテーブル
主に、デフォルト機能で存在しない「ユーザ名」をここで設定する
*/
-- DROP TABLE PUBLIC.PROFILES;
create table public.PROFILES (
    /* Supabase AuthのユーザーID */
    id uuid primary key
        references auth.users(id)
        on delete cascade,

    /* 画面に表示するユーザー名 */
    user_name varchar(50) not null
        check (char_length(trim(user_name)) between 1 and 50),

    /* 登録日時 */
    ins_date timestamptz not null default now()
);
