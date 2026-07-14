# SupabaseAuthの設定

## 概要
今回のRLSはauth.uid()を前提にしているため、実際にログインしたユーザーでないとINSERT・UPDATE・DELETE・Storage操作を確認できません。  
以下の操作を行います。
1. メール・パスワード認証を確認
1. 開発用ユーザを作成
1. フロントエンドを作成
1. Supabaseへ接続
1. ログイン確認
1. 一覧表示
1. 投稿・アップロード

## メール・パスワード認証を確認
```
Authentication
→ Sign In / Providers
→ Email
```
