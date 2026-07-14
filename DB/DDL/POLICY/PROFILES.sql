alter table public.profiles
enable row level security;

/* ユーザー名は誰でも閲覧可能 */
create policy profiles_select_policy
on public.profiles
for select
to anon, authenticated
using (true);

/* ログインユーザーは自分のプロフィールだけ登録可能 */
create policy profiles_insert_policy
on public.profiles
for insert
to authenticated
with check (
    id = (select auth.uid())
);

/* ログインユーザーは自分のプロフィールだけ更新可能 */
create policy profiles_update_policy
on public.profiles
for update
to authenticated
using (
    id = (select auth.uid())
)
with check (
    id = (select auth.uid())
);