import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './lib/supabase'

function App() {
  const [userName, setUserName] = useState<string>('')
  const [message, setMessage] = useState<string>(
    'Supabaseへ問い合わせています...',
  )

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_name')
        .limit(1)

      if (error) {
        console.error(error)
        setMessage(`取得に失敗しました：${error.message}`)
        return
      }

      if (!data || data.length === 0) {
        setMessage('プロフィールが登録されていません。')
        return
      }

      setUserName(data[0].user_name)
      setMessage('Supabaseとの接続に成功しました。')
    }

    void fetchProfile()
  }, [])

  return (
    <main>
      <h1>冬眠装置 外部ストレージ</h1>

      <p>
        「冬眠装置」で出力したキャラクターデータと
        顔グラのPNG画像を登録・共有するためのWebアプリです。
      </p>

      <section>
        <h2>Supabase接続確認</h2>

        <p>{message}</p>

        {userName && (
          <p>
            登録済みユーザー名：
            <strong>{userName}</strong>
          </p>
        )}
      </section>
    </main>
  )
}

export default App