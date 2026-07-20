// 晋江小说阅读 App 组件
const JinjiangApp = {
    props: ['bookshelf'],
    emits: ['close', 'open-reader', 'import-book'],
    data() {
        return {
            activeTab: 'bookshelf'
        }
    },
    template: `
    <div class="absolute inset-0 z-[1000] bg-[#ffffff] flex flex-col font-sans overflow-hidden">
        
        <!-- 顶部导航栏 -->
        <header v-if="activeTab === 'bookshelf'" class="h-[90px] pt-10 px-4 flex items-center justify-between bg-white shrink-0 z-10 sticky top-0">
            <div class="flex items-baseline gap-2">
                <span class="text-[24px] font-bold text-[#356fcc] tracking-wide">书架</span>
                <span class="text-[13px] text-gray-400 font-medium">{{ bookshelf.length }}本</span>
            </div>
            <div class="flex items-center gap-4 text-gray-500">
                <div class="flex items-center gap-1 cursor-pointer active:opacity-50" @click="$emit('import-book')">
                    <span class="text-[14px]">全部</span>
                    <i class="fas fa-chevron-down text-[10px]"></i>
                </div>
                <i class="fas fa-search text-[18px] cursor-pointer active:opacity-50"></i>
                <i class="fas fa-ellipsis-v text-[18px] ml-2 cursor-pointer active:opacity-50" @click="$emit('close')"></i>
            </div>
        </header>

        <!-- 书架主内容区 -->
        <main v-if="activeTab === 'bookshelf'" class="flex-1 overflow-y-auto px-4 pt-2 pb-6">
            <div v-if="bookshelf.length === 0" class="text-center text-gray-400 mt-32 text-[13px] flex flex-col items-center">
                <i class="fas fa-book-open text-4xl mb-4 opacity-20"></i>
                书架空空如也<br>点击右上角“全部”导入本地 txt
            </div>
            <div class="grid grid-cols-3 gap-x-5 gap-y-6">
                <div v-for="book in bookshelf" :key="book.id" class="flex flex-col relative cursor-pointer active:scale-95 transition" @click="$emit('open-reader', book)">
                    <!-- 书本封面 -->
                    <div class="aspect-[3/4] bg-gray-100 rounded-[6px] shadow-sm border border-gray-100 overflow-hidden relative">
                        <img v-if="book.cover" :src="book.cover" class="w-full h-full object-cover">
                        <div v-else class="w-full h-full flex flex-col items-center justify-center bg-[#eef1f5] text-[#356fcc] p-3 text-center">
                            <span class="text-[13px] font-bold leading-snug line-clamp-3">{{ book.title }}</span>
                        </div>
                        <!-- 红色 New 角标 -->
                        <div class="absolute top-0 right-0 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-bl-[6px] font-medium tracking-wider z-10">New</div>
                    </div>
                    <!-- 标题与作者 -->
                    <div class="mt-2 text-[11px] text-gray-800 leading-[1.4] line-clamp-2">
                        《{{ book.title }}》 作者：{{ book.author }}【完
                    </div>
                    <!-- 进度百分比 -->
                    <div class="text-[10px] text-gray-400 mt-0.5 font-mono">0.0%</div>
                </div>
            </div>
        </main>

        <!-- 其他页面占位 -->
        <main v-else class="flex-1 flex items-center justify-center text-gray-300 text-sm">
            该页面开发中...
        </main>

        <!-- 底部导航栏 -->
        <nav class="h-[75px] bg-[#fdfdfd] border-t border-gray-100/60 flex items-center justify-around pb-safe shrink-0 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] relative z-20">
            <div @click="activeTab = 'bookshelf'" class="flex flex-col items-center justify-center w-[72px] h-[46px] rounded-full transition-all cursor-pointer" :class="activeTab === 'bookshelf' ? 'bg-[#ebf2fb] text-[#356fcc]' : 'text-gray-400'">
                <i class="fas fa-book text-[18px] mb-1"></i>
                <span class="text-[10px] font-bold">书架</span>
            </div>
            <div @click="activeTab = 'library'" class="flex flex-col items-center justify-center w-[72px] h-[46px] rounded-full transition-all cursor-pointer" :class="activeTab === 'library' ? 'bg-[#ebf2fb] text-[#356fcc]' : 'text-gray-400'">
                <i class="far fa-newspaper text-[18px] mb-1"></i>
                <span class="text-[10px] font-bold">书库</span>
            </div>
            <div @click="activeTab = 'stats'" class="flex flex-col items-center justify-center w-[72px] h-[46px] rounded-full transition-all cursor-pointer" :class="activeTab === 'stats' ? 'bg-[#ebf2fb] text-[#356fcc]' : 'text-gray-400'">
                <i class="fas fa-chart-simple text-[18px] mb-1"></i>
                <span class="text-[10px] font-bold">统计</span>
            </div>
            <div @click="activeTab = 'me'" class="flex flex-col items-center justify-center w-[72px] h-[46px] rounded-full transition-all cursor-pointer" :class="activeTab === 'me' ? 'bg-[#ebf2fb] text-[#356fcc]' : 'text-gray-400'">
                <i class="far fa-user text-[18px] mb-1"></i>
                <span class="text-[10px] font-bold">我的</span>
            </div>
        </nav>
    </div>
    `
};
