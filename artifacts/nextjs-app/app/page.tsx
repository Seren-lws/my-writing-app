import Link from "next/link";
import HomeBookList from "./components/HomeBookList";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4ead8] text-stone-800">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_34%),linear-gradient(135deg,#f8f0df_0%,#ead7bd_48%,#d9b991_100%)] px-8 py-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm tracking-[0.28em] text-[#9b744d]">
                SHENGSHENG WRITING ROOM
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#4f3524]">
                声声的写作小屋
              </h1>
              <p className="mt-3 text-[#8a6a4d]">
                慢慢写，慢慢收集灵感，也慢慢把故事养大。
              </p>
            </div>

            <Link
              href="/style"
              className="rounded-full border border-[#d8b98f] bg-[#fff8eb]/70 px-5 py-2 text-sm text-[#6e4b2d] shadow-sm backdrop-blur transition hover:bg-white"
            >
              ⚙️ 我的风格
            </Link>
          </header>

          <section className="rounded-[2rem] border border-[#d6b98f] bg-[#cda374] p-6 shadow-2xl">
            <div className="rounded-[1.5rem] border border-[#e5c99e] bg-[#efd5aa] p-6 shadow-inner">
              <div className="grid grid-cols-12 gap-5">
                <Link
                  href="/write"
                  className="col-span-7 row-span-2 min-h-[440px] rounded-[1.5rem] border border-[#d9c29b] bg-[#fff7e8] p-8 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-[#a37a50]">最近编辑</p>
                      <h2 className="mt-3 text-4xl font-semibold text-[#4f3524]">
                        继续创作
                      </h2>
                    </div>
                    <span className="text-4xl">📖</span>
                  </div>

                  <div className="mt-10 space-y-4 rounded-2xl border border-[#ead8b8] bg-[#fffaf0] p-6">
                    <div className="h-3 w-3/4 rounded-full bg-[#e7d5b8]" />
                    <div className="h-3 w-full rounded-full bg-[#eadcc5]" />
                    <div className="h-3 w-5/6 rounded-full bg-[#eadcc5]" />
                    <div className="h-3 w-2/3 rounded-full bg-[#eadcc5]" />
                  </div>

                  <p className="mt-8 leading-7 text-[#806044]">
                    打开编辑器，把今天脑子里亮起来的那一幕写下来。
                  </p>

                  <div className="mt-10 inline-flex rounded-full bg-[#6e4b2d] px-5 py-2 text-sm text-amber-50">
                    进入写作页 →
                  </div>
                </Link>

                <div className="col-span-5 grid gap-5">
                  <div className="grid grid-cols-2 gap-5">
                    <Link
                      href="/calendar"
                      className="rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-5 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#9b744d]">今日</span>
                        <span className="text-2xl">📅</span>
                      </div>
                      <p className="mt-4 text-4xl font-semibold text-[#4f3524]">
                        12
                      </p>
                      <p className="mt-2 text-sm text-[#8a6a4d]">
                        写作打卡和字数记录
                      </p>
                    </Link>

                    <Link
                      href="/stats"
                      className="rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-5 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="text-3xl">🏆</div>
                      <h3 className="mt-4 text-xl font-semibold text-[#4f3524]">
                        成绩
                      </h3>
                      <p className="mt-2 text-sm text-[#8a6a4d]">
                        收藏、评论和趋势
                      </p>
                    </Link>
                  </div>

                  <Link
                    href="/inspirations"
                    className="rounded-2xl border border-[#d7bd83] bg-[#fff2b8] p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-[#9b744d]">便签纸</p>
                        <h3 className="mt-2 text-2xl font-semibold text-[#4f3524]">
                          灵感收集
                        </h3>
                      </div>
                      <span className="text-3xl">💡</span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#806044]">
                      随手记下片段、台词、梗和突然冒出来的金句。
                    </p>
                  </Link>

                  <Link
                    href="/transform"
                    className="rounded-2xl border border-[#d6c1a2] bg-[#f8eee0] p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-[#9b744d]">工作台</p>
                        <h3 className="mt-2 text-2xl font-semibold text-[#4f3524]">
                          对话炼字
                        </h3>
                      </div>
                      <span className="text-3xl">🔄</span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#806044]">
                      把聊天、跑团或酒馆对话整理成小说正文草稿。
                    </p>
                  </Link>
                </div>

                <Link
                  href="/readers"
                  className="col-span-4 rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-3xl">✉️</div>
                  <h3 className="mt-4 text-xl font-semibold text-[#4f3524]">
                    读者来信
                  </h3>
                  <p className="mt-2 text-sm text-[#8a6a4d]">
                    以后这里会放夸夸、催更和剧情反馈。
                  </p>
                </Link>

                <Link
                  href="/style"
                  className="col-span-4 rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-3xl">🎨</div>
                  <h3 className="mt-4 text-xl font-semibold text-[#4f3524]">
                    写作 DNA
                  </h3>
                  <p className="mt-2 text-sm text-[#8a6a4d]">
                    保存你的语言风格、偏好和禁忌。
                  </p>
                </Link>

                <Link
                  href="/adult-settings"
                  className="col-span-2 rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-3xl">🔞</div>
                  <h3 className="mt-4 text-xl font-semibold text-[#4f3524]">
                    成人创作设置
                  </h3>
                  <p className="mt-2 text-sm text-[#8a6a4d]">
                    设置作品分级、描写偏好和边界
                  </p>
                </Link>

                <Link
                  href="/model-settings"
                  className="col-span-2 rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-3xl">⚙️</div>
                  <h3 className="mt-4 text-xl font-semibold text-[#4f3524]">
                    模型设置
                  </h3>
                  <p className="mt-2 text-sm text-[#8a6a4d]">
                    配置中转站 URL、API Key 和默认模型
                  </p>
                </Link>
              </div>
            </div>
          </section>

          <HomeBookList />

          <p className="mt-6 text-center text-sm text-[#8a6a4d]">
            更好陪伴，更多趣味，更强动力。
          </p>
        </div>
      </div>
    </main>
  );
}