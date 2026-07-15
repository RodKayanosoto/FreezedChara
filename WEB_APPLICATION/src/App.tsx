import { useEffect, useState } from 'react'
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
   * 初回表示時に、公開中の投稿一覧を取得する。
   */
  useEffect(() => {
    const fetchPosts = async () => {
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
    }

    void fetchPosts()
  }, [])

  /**
   * ログイン処理
   */
  const handleLogin = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      setMessage('メールアドレスとパスワードを入力してください。')
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