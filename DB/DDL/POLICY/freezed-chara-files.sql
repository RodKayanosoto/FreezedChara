/* 
バケット「freezed-chara-files」用のポリシーを設定する
ログインユーザーは自分のフォルダにのみファイルをアップロードできる
*/
create policy freezed_chara_files_insert_policy
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'freezed-chara-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);
/*
 * 公開投稿のファイル、または自分の投稿ファイルを
 * ダウンロードできる
 */
create policy freezed_chara_files_select_policy
on storage.objects
for select
to anon, authenticated
using (
    bucket_id = 'freezed-chara-files'
    and exists (
        select 1
        from public.freezed_chara fc
        where (
            fc.chara_file_path = storage.objects.name
            or fc.image_file_path = storage.objects.name
        )
        and (
            fc.status = '0'
            or fc.user_id = (select auth.uid())
        )
    )
);
/*
 * ログインユーザーは自分のフォルダにある
 * ファイルだけ更新できる
 */
create policy freezed_chara_files_update_policy
on storage.objects
for update
to authenticated
using (
    bucket_id = 'freezed-chara-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
    bucket_id = 'freezed-chara-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);
/*
 * ログインユーザーは自分のフォルダにある
 * ファイルだけ削除できる
 */
create policy freezed_chara_files_delete_policy
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'freezed-chara-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);