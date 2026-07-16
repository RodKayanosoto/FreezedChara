import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import './App.css'
import { supabase } from './lib/supabase'

/**
 * 投稿一覧としてSupabaseから取得するデータの型
 */
type FreezedCharaPost = {
  id: string
  comment: string
  ins_date: string
  profiles: {
    user_name: string
  } | null
}

/**
 * 投稿時に選択できる公開状態
 * 0：公開
 * 1：非公開
 */
type PostStatus = '0' | '1'

function App() {
  /*
   * ログインフォームの入力値
   */
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  /*
   * ログイン中のユーザー情報
   */
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState('')

  /*
   * ログイン処理に関する表示
   */
  const [message, setMessage] = useState(
    'メールアドレスとパスワードを入力してください。',
  )
  const [isProcessing, setIsProcessing] = useState(false)

  /*
   * 投稿フォームの入力値
   */
  const [postComment, setPostComment] = useState('')
  const [charaFile, setCharaFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [postStatus, setPostStatus] = useState<PostStatus>('0')
  const [postMessage, setPostMessage] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  /*
   * 投稿一覧
   */
  const [posts, setPosts] = useState<FreezedCharaPost[]>([])
  const [postsMessage, setPostsMessage] = useState(
    '投稿一覧を取得しています...',
  )

  /**
   * 初回表示時に、保存済みのログインセッションを確認する。
   * また、ログイン・ログアウトの状態変化を監視する。
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error(error)
        setMessage(`セッション確認に失敗しました：${error.message}`)
        return
      }

      setUser(session?.user ?? null)
    }

    void initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * ログインユーザーが変わったときに、
   * profilesテーブルから表示用ユーザー名を取得する。
   */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setUserName('')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('user_name')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error(error)
        setUserName('')
        setMessage(`ユーザー名の取得に失敗しました：${error.message}`)
        return
      }

      setUserName(data.user_name)
      setMessage('ログインしています。')
    }

    void fetchProfile()
  }, [user])

  /**
   * 公開中の投稿一覧をSupabaseから取得する。
   *
   * 投稿成功後にも同じ処理を呼び出すため、
   * useCallbackで関数を保持する。
   */
  const fetchPosts = useCallback(async () => {
    setPostsMessage('投稿一覧を取得しています...')

    const { data, error } = await supabase
      .from('freezed_chara')
      .select(`
        id,
        comment,
        ins_date,
        profiles:profiles!fk_freezed_chara_user (
          user_name
        )
      `)
      .eq('status', '0')
      .order('ins_date', { ascending: false })

    if (error) {
      console.error(error)
      setPosts([])
      setPostsMessage(
        `投稿一覧の取得に失敗しました：${error.message}`,
      )
      return
    }

    const fetchedPosts = (data ?? []) as FreezedCharaPost[]

    setPosts(fetchedPosts)

    if (fetchedPosts.length === 0) {
      setPostsMessage('公開中の投稿はありません。')
      return
    }

    setPostsMessage(`${fetchedPosts.length}件の投稿を取得しました。`)
  }, [])

  /**
   * 初回表示時に投稿一覧を取得する。
   */
  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  /**
   * 投稿するファイルを検証する。
   */
  const validateFiles = async (
    selectedCharaFile: File,
    selectedImageFile: File | null,
  ) => {
    const maxCharaFileSize = 5 * 1024 * 1024
    const maxPngFileSize = 500 * 1024

    if (selectedCharaFile.size === 0) {
      throw new Error(
        'キャラクターデータファイルが空です。',
      )
    }

    if (selectedCharaFile.size > maxCharaFileSize) {
      throw new Error(
        'キャラクターデータは5MB以下にしてください。',
      )
    }

    /*
     * キャラクターデータの先頭8バイトを確認する。
     *
     * 想定値：
     * 89 45 52 41 0D 0A 1A 0A
     */
    const expectedHeader = [
      0x89,
      0x45,
      0x52,
      0x41,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
    ]

    const headerBuffer = await selectedCharaFile
      .slice(0, 8)
      .arrayBuffer()

    const actualHeader = new Uint8Array(headerBuffer)

    const hasValidHeader =
      actualHeader.length === expectedHeader.length &&
      expectedHeader.every(
        (value, index) => actualHeader[index] === value,
      )

    if (!hasValidHeader) {
      throw new Error(
        '対応していないキャラクターデータ形式です。',
      )
    }

    /*
     * PNG画像は任意なので、未選択ならここで検証終了。
     */
    if (!selectedImageFile) {
      return
    }

    if (selectedImageFile.type !== 'image/png') {
      throw new Error('画像はPNG形式にしてください。')
    }

    if (selectedImageFile.size === 0) {
      throw new Error('PNG画像が空です。')
    }

    if (selectedImageFile.size > maxPngFileSize) {
      throw new Error('PNG画像は500KB以下にしてください。')
    }
  }

  /**
   * 投稿処理
   */
  const handlePost = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!user) {
      setPostMessage('投稿するにはログインが必要です。')
      return
    }

    const trimmedComment = postComment.trim()

    if (!trimmedComment) {
      setPostMessage('コメントを入力してください。')
      return
    }

    if (trimmedComment.length > 400) {
      setPostMessage('コメントは400文字以下にしてください。')
      return
    }

    if (!charaFile) {
      setPostMessage(
        'キャラクターデータファイルを選択してください。',
      )
      return
    }

    setIsPosting(true)
    setPostMessage('投稿しています...')

    /*
     * DBの投稿IDとStorage内のフォルダ名に、
     * 同一のUUIDを使用する。
     */
    const postId = crypto.randomUUID()
    const basePath = `${user.id}/${postId}`

    const charaPath = `${basePath}/chara.dat`

    const imagePath = imageFile
      ? `${basePath}/image.png`
      : null

    try {
      await validateFiles(charaFile, imageFile)

      /*
       * キャラクターデータをStorageへ保存する。
       */
      const { error: charaUploadError } =
        await supabase.storage
          .from('freezed-chara-files')
          .upload(charaPath, charaFile, {
            contentType: 'application/octet-stream',
            upsert: false,
          })

      if (charaUploadError) {
        throw new Error(
          `キャラクターデータの保存に失敗しました：${charaUploadError.message}`,
        )
      }

      /*
       * PNG画像が選択されている場合だけStorageへ保存する。
       */
      if (imageFile && imagePath) {
        const { error: imageUploadError } =
          await supabase.storage
            .from('freezed-chara-files')
            .upload(imagePath, imageFile, {
              contentType: 'image/png',
              upsert: false,
            })

        if (imageUploadError) {
          /*
           * PNGの保存に失敗した場合、
           * 先に保存したキャラクターデータを削除する。
           */
          await supabase.storage
            .from('freezed-chara-files')
            .remove([charaPath])

          throw new Error(
            `PNG画像の保存に失敗しました：${imageUploadError.message}`,
          )
        }
      }

      /*
       * Storageへの保存後、投稿情報をDBへ登録する。
       */
      const { error: insertError } = await supabase
        .from('freezed_chara')
        .insert({
          id: postId,
          user_id: user.id,
          comment: trimmedComment,
          chara_file_path: charaPath,
          image_file_path: imagePath,
          original_chara_filename: charaFile.name,
          original_image_filename: imageFile?.name ?? null,
          status: postStatus,
          note: null,
        })

      if (insertError) {
        /*
         * DBへの登録に失敗した場合、
         * Storageへ保存済みのファイルを削除する。
         */
        const removePaths = [charaPath]

        if (imagePath) {
          removePaths.push(imagePath)
        }

        await supabase.storage
          .from('freezed-chara-files')
          .remove(removePaths)

        throw new Error(
          `投稿情報の登録に失敗しました：${insertError.message}`,
        )
      }

      /*
       * 投稿成功後に入力値を初期化する。
       */
      setPostComment('')
      setCharaFile(null)
      setImageFile(null)
      setPostStatus('0')
      setPostMessage('投稿に成功しました。')

      /*
       * 最新の投稿一覧を再取得する。
       */
      await fetchPosts()
    } catch (error) {
      console.error(error)

      setPostMessage(
        error instanceof Error
          ? error.message
          : '投稿中に不明なエラーが発生しました。',
      )
    } finally {
      setIsPosting(false)
    }
  }

  /**
   * ログイン処理
   */
  const handleLogin = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      setMessage(
        'メールアドレスとパスワードを入力してください。',
      )
      return
    }

    setIsProcessing(true)
    setMessage('ログインしています...')

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (error) {
      console.error(error)
      setMessage(`ログインに失敗しました：${error.message}`)
      setIsProcessing(false)
      return
    }

    setPassword('')
    setMessage('ログインに成功しました。')
    setIsProcessing(false)
  }

  /**
   * ログアウト処理
   */
  const handleLogout = async () => {
    setIsProcessing(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(error)
      setMessage(`ログアウトに失敗しました：${error.message}`)
      setIsProcessing(false)
      return
    }

    setUserName('')
    setMessage('ログアウトしました。')
    setIsProcessing(false)
  }

  return (
    <main>
      <h1>冬眠装置 外部ストレージ</h1>

      <p>
        「冬眠装置」で出力したキャラクターデータと
        PNG画像を登録・共有するためのWebアプリです。
      </p>

      <section>
        <h2>ログイン</h2>

        <p>{message}</p>

        {user ? (
          <div>
            <p>
              ユーザー名：
              <strong>{userName || '取得中...'}</strong>
            </p>

            <p>
              メールアドレス：
              {user.email ?? '不明'}
            </p>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isProcessing}
            >
              {isProcessing ? '処理中...' : 'ログアウト'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div>
              <label htmlFor="email">
                メールアドレス
              </label>

              <br />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                }}
                autoComplete="email"
                disabled={isProcessing}
              />
            </div>

            <div>
              <label htmlFor="password">
                パスワード
              </label>

              <br />

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                }}
                autoComplete="current-password"
                disabled={isProcessing}
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing ? '処理中...' : 'ログイン'}
            </button>
          </form>
        )}
      </section>

      {user && (
        <section>
          <h2>キャラクターを登録</h2>

          {postMessage && <p>{postMessage}</p>}

          <form onSubmit={handlePost}>
            <div>
              <label htmlFor="post-comment">
                コメント
              </label>

              <br />

              <textarea
                id="post-comment"
                value={postComment}
                onChange={(event) => {
                  setPostComment(event.target.value)
                }}
                maxLength={400}
                rows={5}
                disabled={isPosting}
              />
            </div>

            <div>
              <label htmlFor="chara-file">
                キャラクターデータファイル
              </label>

              <br />

              <input
                id="chara-file"
                type="file"
                accept=".dat,application/octet-stream"
                onChange={(event) => {
                  setCharaFile(
                    event.target.files?.[0] ?? null,
                  )
                }}
                disabled={isPosting}
              />
            </div>

            <div>
              <label htmlFor="image-file">
                PNG画像（任意・500KB以下）
              </label>

              <br />

              <input
                id="image-file"
                type="file"
                accept="image/png"
                onChange={(event) => {
                  setImageFile(
                    event.target.files?.[0] ?? null,
                  )
                }}
                disabled={isPosting}
              />
            </div>

            <div>
              <label htmlFor="post-status">
                公開状態
              </label>

              <br />

              <select
                id="post-status"
                value={postStatus}
                onChange={(event) => {
                  setPostStatus(
                    event.target.value as PostStatus,
                  )
                }}
                disabled={isPosting}
              >
                <option value="0">公開</option>
                <option value="1">非公開</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPosting}
            >
              {isPosting ? '投稿中...' : '投稿'}
            </button>
          </form>
        </section>
      )}

      <section>
        <h2>登録キャラクター一覧</h2>

        <p>{postsMessage}</p>

        {posts.length > 0 && (
          <div>
            {posts.map((post) => (
              <article key={post.id}>
                <h3>
                  投稿者：
                  {post.profiles?.user_name ??
                    '不明なユーザー'}
                </h3>

                <p>{post.comment}</p>

                <p>
                  登録日時：
                  {new Date(post.ins_date).toLocaleString(
                    'ja-JP',
                    {
                      timeZone: 'Asia/Tokyo',
                    },
                  )}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App