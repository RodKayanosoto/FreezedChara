insert into public.freezed_chara (
    user_id,
    comment,
    chara_file_path,
    image_file_path,
    original_chara_filename,
    original_image_filename,
    status,
    note
)
values (
    'c8f2b378-5bfe-41ec-8bfd-3fba511858e2',
    '一覧表示確認用のテスト投稿です。',
    'test-user/test-post/chara.dat',
    'test-user/test-post/image.png',
    'test_character.dat',
    'test_image.png',
    '0',
    'Reactからの一覧取得確認用'
);