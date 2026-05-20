import Link from "next/link";
import HomeBookList from "./components/HomeBookList";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4ead8] text-stone-800">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_34%),linear-gradient(135deg,#f8f0df_0%,#ead7bd_48%,#d9b991_100%)] px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 flex items-center justify-between md:mb-8">
            <div>
              <p className="text-xs tracking-[0.2em] text-[#9b744d] md:text-sm md:tracking-[0.28em]">
                SHENGSHENG WRITING ROOM
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#4f3524] md:mt-3 md:text-4xl">
                声声的写作小屋
              </h1>
              <p className="mt-2 text-sm text-[#8a6a4d] md:mt-3 md:text-base">
                慢慢写，慢慢收集灵感，也慢慢把故事养大。
              </p>
            </div>

            <Link
              href="/model-settings"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8b98f] bg-[#fff8eb]/70 text-xl shadow-sm backdrop-blur transition hover:bg-white md:h-auto md:w-auto md:px-5 md:py-2 md:text-sm md:text-[#6e4b2d]"
            >
              <span>⚙️</span>
              <span className="ml-1.5 hidden md:inline">模型设置</span>
            </Link>
          </header>

          <section className="rounded-[1.5rem] border border-[#d6b98f] bg-[#cda374] p-3 shadow-2xl md:rounded-[2rem] md:p-6">
            <div className="rounded-[1.2rem] border border-[#e5c99e] bg-[#efd5aa] p-3 shadow-inner md:rounded-[1.5rem] md:p-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-5">

                {/* 继续创作 */}
                <Link
                  href="/write"
                  className="col-span-2 min-h-[160px] rounded-2xl border border-[#d9c29b] bg-[#fff7e8] p-5 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl md:col-span-7 md:row-span-2 md:min-h-[440px] md:rounded-[1.5rem] md:p-8"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-[#a37a50] md:text-sm">最近编辑</p>
                      <h2 className="mt-1 text-2xl font-semibold text-[#4f3524] md:mt-3 md:text-4xl">
                        继续创作
                      </h2>
                    </div>
                    <span className="text-3xl md:text-4xl">📖</span>
                  </div>

                  <div className="mt-4 hidden space-y-4 rounded-2xl border border-[#ead8b8] bg-[#fffaf0] p-6 md:block md:mt-10">
                    <div className="h-3 w-3/4 rounded-full bg-[#e7d5b8]" />
                    <div className="h-3 w-full rounded-full bg-[#eadcc5]" />
                    <div className="h-3 w-5/6 rounded-full bg-[#eadcc5]" />
                    <div className="h-3 w-2/3 rounded-full bg-[#eadcc5]" />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#806044] md:mt-8 md:text-base md:leading-7">
                    打开编辑器，把今天脑子里亮起来的那一幕写下来。
                  </p>

                  <div className="mt-4 inline-flex rounded-full bg-[#6e4b2d] px-4 py-1.5 text-xs text-amber-50 md:mt-10 md:px-5 md:py-2 md:text-sm">
                    进入写作页 →
                  </div>
                </Link>

                {/* 右侧四格 */}
                <div className="col-span-2 grid gap-3 md:col-span-5 md:gap-5">
                  <div className="grid grid-cols-2 gap-3 md:gap-5">
                    <Link
                      href="/calendar"
                      className="rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-4 shadow-md transition hover:-translate-y-1 hover:shadow-lg md:p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#9b744d] md:text-sm">今日</span>
                        <span className="text-xl md:text-2xl">📅</span>
                      </div>
                      <p className="mt-2 text-3xl font-semibold text-[#4f3524] md:mt-4 md:text-4xl">
                        12
                      </p>
                      <p className="mt-1 text-xs text-[#8a6a4d] md:mt-2 md:text-sm">
                        写作打卡和字数记录
                      </p>
                    </Link>

                    <Link
                      href="/stats"
                      className="rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-4 shadow-md transition hover:-translate-y-1 hover:shadow-lg md:p-5"
                    >
                      <div className="text-2xl md:text-3xl">🏆</div>
                      <h3 className="mt-2 text-lg font-semibold text-[#4f3524] md:mt-4 md:text-xl">
                        成绩
                      </h3>
                      <p className="mt-1 text-xs text-[#8a6a4d] md:mt-2 md:text-sm">
                        收藏、评论和趋势
                      </p>
                    </Link>
                  </div>

                  <Link
                    href="/inspirations"
                    className="rounded-2xl border border-[#d7bd83] bg-[#fff2b8] p-4 shadow-md transition hover:-translate-y-1 hover:shadow-lg md:p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#9b744d] md:text-sm">便签纸</p>
                        <h3 className="mt-1 text-xl font-semibold text-[#4f3524] md:mt-2 md:text-2xl">
                          灵感收集
                        </h3>
                      </div>
                      <span className="text-2xl md:text-3xl">💡</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#806044] md:mt-4 md:text-sm md:leading-6">
                      随手记下片段、台词、梗和突然冒出来的金句。
                    </p>
                  </Link>

                  <Link
                    href="/transform"
                    className="rounded-2xl border border-[#d6c1a2] bg-[#f8eee0] p-4 shadow-md transition hover:-translate-y-1 hover:shadow-lg md:p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#9b744d] md:text-sm">工作台</p>
                        <h3 className="mt-1 text-xl font-semibold text-[#4f3524] md:mt-2 md:text-2xl">
                          对话炼字
                        </h3>
                      </div>
                      <span className="text-2xl md:text-3xl">🔄</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#806044] md:mt-4 md:text-sm md:leading-6">
                      把聊天、跑团或酒馆对话整理成小说正文草稿。
                    </p>
                  </Link>
                </div>

                {/* 底部四格 */}
                <Link
                  href="/readers"
                  className="col-span-1 rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-4 shadow-md transition hover:-translate-y-1 hover:shadow-lg md:col-span-4 md:p-6"
                >
                  <div className="text-2xl md:text-3xl">✉️</div>
                  <h3 className="mt-2 text-base font-semibold text-[#4f3524] md:mt-4 md:text-xl">
                    读者来信
                  </h3>
                  <p className="mt-1 text-xs text-[#8a6a4d] md:mt-2 md:text-sm">
                    夸夸、催更和剧情反馈。
                  </p>
                </Link>

                <Link
                  href="/style"
                  className="col-span-1 rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-4 shadow-md transition hover:-translate-y-1 hover:shadow-lg md:col-span-4 md:p-6"
                >
                  <div className="text-2xl md:text-3xl">🎨</div>
                  <h3 className="mt-2 text-base font-semibold text-[#4f3524] md:mt-4 md:text-xl">
                    写作 DNA
                  </h3>
                  <p className="mt-1 text-xs text-[#8a6a4d] md:mt-2 md:text-sm">
                    语言风格、偏好和禁忌。
                  </p>
                </Link>

                <Link
                  href="/adult-settings"
                  className="col-span-1 rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-4 shadow-md transition hover:-translate-y-1 hover:shadow-lg md:col-span-2 md:p-6"
                >
                  <div className="text-2xl md:text-3xl">🔞</div>
                  <h3 className="mt-2 text-sm font-semibold text-[#4f3524] md:mt-4 md:text-xl">
                    成人设置
                  </h3>
                  <p className="mt-1 hidden text-xs text-[#8a6a4d] md:mt-2 md:block md:text-sm">
                    分级、描写偏好和边界
                  </p>
                </Link>

                <Link
                  href="/model-settings"
                  className="col-span-1 rounded-2xl border border-[#dbc29e] bg-[#fff8eb] p-4 shadow-md transition hover:-translate-y-1 hover:shadow-lg md:col-span-2 md:p-6"
                >
                  <div className="text-2xl md:text-3xl">⚙️</div>
                  <h3 className="mt-2 text-sm font-semibold text-[#4f3524] md:mt-4 md:text-xl">
                    模型设置
                  </h3>
                  <p className="mt-1 hidden text-xs text-[#8a6a4d] md:mt-2 md:block md:text-sm">
                    URL、API Key 和模型
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
