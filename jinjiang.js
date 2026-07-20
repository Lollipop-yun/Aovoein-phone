const JinjiangApp = {
    props: ['bookshelf', 'bookshelfState'],
    emits: ['close', 'toast', 'save-data', 'trigger-import', 'read-book'],
    template: `
    <div class="absolute inset-0 z-[1000] bg-[#ffffff] flex flex-col font-sans overflow-hidden">
        
        <!-- 顶部 Header -->
        <header class="h-[90px] pt-10 px-5 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-baseline gap-2">
                <h1 class="text-[24px] font-bold text-[#3070E8]">书架</h1>
                <span class="text-[12px] text-gray-400 font-medium">{{ bookshelf.length }}本</span>
            </div>
            <div class="flex items-center gap-5 text-gray-500">
                <div class="flex items-center gap-1 text-[13px] text-gray-600 font-medium"><span>全部</span><i class="fas fa-chevron-down text-[10px] text-gray-400"></i></div>
                <i class="fas fa-search text-[18px] text-gray-400"></i>
                <i class="fas fa-ellipsis-v text-[18px] text-gray-400 cursor-pointer" @click="$emit('trigger-import')"></i>
                <i class="fas fa-times text-[18px] text-gray-800 ml-1 cursor-pointer active:scale-90" @click="$emit('close')"></i>
            </div>
        </header>

        <!-- 书架内容区 -->
        <div class="flex-1 overflow-y-auto px-5 py-2 pb-28">
            <div v-if="bookshelf.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400">
                <i class="fas fa-book-open text-4xl mb-4 opacity-20 text-[#3070E8]"></i>
                <p class="text-[13px]">你的书架空空如也</p>
                <button @click="$emit('trigger-import')" class="mt-5 px-8 py-2.5 bg-[#3070E8] text-white rounded-full text-sm font-bold shadow-md active:scale-95 transition">导入小说</button>
            </div>
            
            <div class="grid grid-cols-3 gap-x-4 gap-y-6">
                <div v-for="book in bookshelf" :key="book.id" class="flex flex-col relative cursor-pointer active:scale-95 transition group" @click="$emit('read-book', book)">
                    
                    <!-- 封面区域 -->
                    <div class="aspect-[3/4] bg-[#f7f8fa] rounded-[6px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden relative border border-gray-100">
                        <img v-if="book.cover" :src="book.cover" class="w-full h-full object-cover">
                        <div v-else class="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                            <span class="text-[13px] font-bold leading-snug line-clamp-3 text-gray-600" style="font-family: 'Kaiti SC', serif;">{{ book.title }}</span>
                        </div>
                        
                        <!-- 还原图中的红色 New 标签 -->
                        <div class="absolute top-0 right-0 bg-[#E63A3A] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-[8px] shadow-sm tracking-wider">
                            New
                        </div>
                    </div>
                    
                    <!-- 底部文字资料 -->
                    <div class="mt-2 text-[12px] text-gray-800 leading-[1.4] line-clamp-2 font-medium">《{{ book.title }}》 作者：{{ book.author || '未知' }}【完】</div>
                    <div class="mt-1 text-[11px] text-gray-400 font-mono tracking-tighter">0.0%</div>
                </div>
            </div>
        </div>

        <!-- 底部导航栏 -->
        <div class="absolute bottom-0 w-full h-[85px] bg-white/95 backdrop-blur-xl border-t border-gray-100 flex items-start pt-2 justify-around px-2 pb-safe z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
            <div class="flex flex-col items-center justify-center w-[70px] h-12 bg-[#F2F6FE] text-[#3070E8] rounded-full cursor-pointer transition">
                <i class="fas fa-book text-[18px]"></i>
                <span class="text-[10px] mt-0.5 font-bold">书架</span>
            </div>
            <div class="flex flex-col items-center justify-center w-[70px] h-12 text-gray-400 hover:text-gray-600 cursor-pointer transition" @click="$emit('toast', '书库页面待开发')">
                <i class="fas fa-store text-[18px]"></i>
                <span class="text-[10px] mt-0.5 font-medium">书库</span>
            </div>
            <div class="flex flex-col items-center justify-center w-[70px] h-12 text-gray-400 hover:text-gray-600 cursor-pointer transition" @click="$emit('toast', '统计功能待接入')">
                <i class="fas fa-chart-simple text-[18px]"></i>
                <span class="text-[10px] mt-0.5 font-medium">统计</span>
            </div>
            <div class="flex flex-col items-center justify-center w-[70px] h-12 text-gray-400 hover:text-gray-600 cursor-pointer transition" @click="$emit('toast', '用户中心待开发')">
                <i class="far fa-user text-[18px]"></i>
                <span class="text-[10px] mt-0.5 font-medium">我的</span>
            </div>
        </div>
    </div>
    `
};
