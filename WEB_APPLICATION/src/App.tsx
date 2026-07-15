import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import './App.css'
import { supabase } from './lib/supabase'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState('')

  const [message, setMessage] = useState(
    'メールアドレスとパスワードを入力してください。',
  )
  const [isProcessing, setIsProcessing] = useState(false)

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
        setMessage(`ユーザー名の取得に失敗しました：${error.message}`)
        return
      }

      setUserName(data.user_name)
      setMessage('ログインしています。')
    }

    void fetchProfile()
  }, [user])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      setMessage('メールアドレスとパスワードを入力してください。')
      return
    }

    setIsProcessing(true)
    setMessage('ログインしています...')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
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

  const handleLogout = async () => {
    setIsProcessing(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(error)
      setMessage(`ログアウトに失敗しました：${error.message}`)
      setIsProcessing(false)
      return
    }

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

            <p>メールアドレス：{user.email}</p>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isProcessing}
            >
              ログアウト
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div>
              <label htmlFor="email">メールアドレス</label>
              <br />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password">パスワード</label>
              <br />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={isProcessing}>
              ログイン
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default App