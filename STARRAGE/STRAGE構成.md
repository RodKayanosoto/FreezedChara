# STRAGE構成

## 前提
冬眠キャラとそのPNG画像を保存するSupabase Storageのバケットを作成する。  
一般公開URLでの無制限参照は許可しません。  
RLSで制御できるように非公開(Private)バケットを使用します。  
Privateバケットでも、RLSポシリーを通じて未ログイン利用者への公開投稿ファイルをダウンロードさせられます。

## Storageバケットの作成
以下の設定でbucketを作成する  
+ バケット名：```freezed-chara-files```
+ Public_bucket：oOFF
+ Restrict_file_size:ON
    + 5MB
+ Restrict_MIME_types:ON
    + image/png
    + application/octet-stream

## Strage用のRLSポリシーの作成
以下のバケット用ポリシーのファイルを参照  
```
FreezedChara\DB\DDL\POLICY\freezed-chara-files.sql
```
