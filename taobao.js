const TaobaoApp = {
    props: ['wechatState', 'wallet', 'apiConfig', 'homeProfile', 'masks'],
    emits: ['close', 'toast', 'save-data', 'add-to-wallet', 'scroll-to-bottom'],
    data() {
        return {
            taobaoModal: { activeTab: 'home', activeCategory: '服饰', note: '', selectedItem: null, storeList: [], searchKeyword: '', isSearching: false, searchResults: [], hotSales: [], cartItems: [] },
            taobaoDescModal: { show: false, content: '', isGenerating: false },
            taobaoPayTargetModal: { show: false }
        }
    },
    mounted() {
        this.refreshTaobaoItems();
    },
    methods: {
        closeApp() { this.$emit('close'); },
        showToast(msg) { this.$emit('toast', msg); },
        saveData() { this.$emit('save-data'); },
        getMaskById(id) {
            return this.masks.find(m => m.id === id) || { name: '我', avatar: 'https://pic1.imgdb.cn/item/69d5d388fe07599d0e204634.jpg', bio: '' };
        },
        refreshTaobaoItems() {
            // 将原本外卖商铺改为桃宝店铺风格
            this.taobaoModal.storeList = [
                { id: 1, category: '服饰', name: '优衣库官方旗舰店', tag: '品牌精选', items:[{name: '纯棉短袖T恤', price: '79.00'}, {name: '修身牛仔裤', price: '199.00'}, {name: '防晒轻薄外套', price: '149.00'}] },
                { id: 2, category: '服饰', name: 'ZARA官方旗舰店', tag: '快时尚', items:[{name: '复古印花衬衫', price: '129.00'}, {name: '高腰阔腿裤', price: '259.00'}, {name: '时尚百搭风衣', price: '299.00'}] },
                { id: 3, category: '数码', name: 'Apple产品官方旗舰店', tag: '正品保证', items:[{name: 'AirPods Pro 2', price: '1899.00'}, {name: '20W 充电头', price: '149.00'}, {name: 'MagSafe 保护壳', price: '399.00'}] },
                { id: 4, category: '数码', name: '小米官方旗舰店', tag: '极客之选', items:[{name: '小米手环 8', price: '239.00'}, {name: 'Redmi 充电宝', price: '99.00'}, {name: '米家台灯', price: '169.00'}] },
                { id: 5, category: '美妆', name: '完美日记旗舰店', tag: '平价好物', items:[{name: '原石眼影盘', price: '119.00'}, {name: '持色唇釉', price: '69.00'}, {name: '定妆散粉', price: '89.00'}] },
                { id: 6, category: '美妆', name: 'MAC魅可官方旗舰店', tag: '大牌美妆', items:[{name: '经典子弹头口红', price: '190.00'}, {name: '定制无瑕粉底液', price: '340.00'}, {name: '生姜高光', price: '360.00'}] },
                { id: 7, category: '零食', name: '三只松鼠旗舰店', tag: '吃货必逛', items:[{name: '每日坚果大礼包', price: '88.00'}, {name: '手撕面包一整箱', price: '29.90'}, {name: '芒果干', price: '25.00'}] },
                { id: 8, category: '零食', name: '百草味旗舰店', tag: '满减优惠', items:[{name: '抱抱果干', price: '19.90'}, {name: '夏威夷果', price: '39.90'}, {name: '鸭脖肉肉包', price: '35.80'}] },
                { id: 9, category: '日用', name: '无印良品旗舰店', tag: '生活百货', items:[{name: '香薰机', price: '199.00'}, {name: '极简收纳盒', price: '45.00'}, {name: '纯棉四件套', price: '299.00'}] }
            ];

            const merchantIntros = [
                '本店爆款推荐！材质优良，做工精细，好评率高达99%，闭眼入绝不踩雷！',
                '官方正品保证！采用最新技术，细节处理得恰到好处，保证让您惊艳，体验感极佳！',
                '高性价比之选！兼顾美观与实用，设计感拉满，给您带来全新的品质生活体验。',
                '销量冠军！诚意满满的用料，品质对得起价格，绝对是您治愈生活疲惫的绝佳选择。'
            ];

            let allItems = [];
            this.taobaoModal.storeList.forEach(store => {
                store.items.forEach(item => {
                    item.sales = Math.floor(Math.random() * 8000 + 500);
                    item.desc = merchantIntros[Math.floor(Math.random() * merchantIntros.length)];
                    item.appearance = `一件包装精美的${item.name}，使用印有品牌Logo的快递盒仔细封装着。拆开后可以看到商品完好无损，质感极佳，没有任何瑕疵，呈现出超出期待的高品质。`; 
                    allItems.push({...item, storeName: store.name, category: store.category});
                });
                store.items.sort(() => Math.random() - 0.5);
            });
            allItems.sort(() => Math.random() - 0.5);
            this.taobaoModal.hotSales = allItems;
        },
        openTaobaoItem(item, storeName) {
            this.taobaoModal.selectedItem = {
                store: storeName,
                name: item.name,
                price: item.price,
                sales: item.sales,
                desc: item.desc,
                appearance: item.appearance
            };
        },
        doTaobaoSearch() {
            if (!this.taobaoModal.searchKeyword.trim()) return;
            this.taobaoModal.activeTab = 'search';
            this.taobaoModal.isSearching = true;
            this.taobaoModal.searchResults = [];
            
            setTimeout(() => {
                this.taobaoModal.isSearching = false;
                const count = Math.floor(Math.random() * 3) + 5; 
                const results = [];
                const storeNames = ["精选自营店", "潮流优选", "人气网红榜", "品牌旗舰店", "海外代购", "精选小铺"];
                const kw = this.taobaoModal.searchKeyword;
                
                for (let i = 0; i < count; i++) {
                    const itemName = kw + (['定制版', '升级版', '新款', '热卖版', '豪华版'][Math.floor(Math.random()*5)]);
                    results.push({
                        store: storeNames[i],
                        name: itemName,
                        price: (Math.random() * 200 + 30).toFixed(2),
                        sales: Math.floor(Math.random() * 9000 + 100),
                        desc: `【店长极力推荐】这绝对是本店关于${kw}的巅峰之作！精选优质材料，独家设计，给您最好的体验，好评如潮，买它准没错！`,
                        appearance: `一件刚刚拆箱的${itemName}，做工非常精致。包装防撞措施做得很到位，商品表面泛着全新的光泽，拿在手里分量十足，呈现出令人满意的优质质感。`
                    });
                }
                this.taobaoModal.searchResults = results;
            }, 1000);
        },
        showTaobaoDesc() {
            if (!this.taobaoModal.selectedItem) return;
            this.taobaoDescModal.content = this.taobaoModal.selectedItem.appearance;
            this.taobaoDescModal.show = true;
        },
        async generateTaobaoDesc() {
            if (!this.taobaoModal.selectedItem) return;
            const item = this.taobaoModal.selectedItem;
            this.taobaoDescModal.show = true;
            this.taobaoDescModal.isGenerating = true;
            this.taobaoDescModal.content = '';

            if (!this.apiConfig.apiKey) {
                setTimeout(() => {
                    this.taobaoDescModal.content = `【${item.name}】是本店精心挑选的口碑好物，材质严格把控，工艺极其考究，绝对能够满足您挑剔的眼光，给您带来绝佳的使用体验，千万不要错过哦！`;
                    this.taobaoDescModal.isGenerating = false;
                }, 800);
                return;
            }
            try {
                let url = this.apiConfig.baseUrl.trim().replace(/\/+$/, '');
                if (!url.endsWith('/v1')) url += '/v1';
                
                const res = await fetch(`${url}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiConfig.apiKey.trim()}` },
                    body: JSON.stringify({ 
                        model: this.apiConfig.selectedModel, 
                        messages:[
                            { role: 'system', content: '你是一个顶级的电商商品文案策划大师。' },
                            { role: 'user', content: `请为网购商品“${item.name}”写一段不少于 25 个字、极具吸引力且详细的外观描述文案，突出它的极致质感、高级选材和工艺。请直接输出一段纯文本描述，不要有任何多余的开场白或引号。` }
                        ],
                        temperature: 0.8
                    })
                });
                if(!res.ok) throw new Error('API Error');
                const data = await res.json();
                this.taobaoDescModal.content = data.choices[0].message.content.trim();
            } catch(e) {
                this.taobaoDescModal.content = `【${item.name}】是本店精心挑选的口碑好物，质量绝佳！`;
                this.showToast('生成描述失败，已使用默认描述');
            } finally {
                this.taobaoDescModal.isGenerating = false;
            }
        },
        getCartTotal() {
            if (!this.taobaoModal.cartItems || this.taobaoModal.cartItems.length === 0) return '0.00';
            return this.taobaoModal.cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);
        },
        addToCart() {
            if (!this.taobaoModal.selectedItem) return;
            this.taobaoModal.cartItems.unshift({...this.taobaoModal.selectedItem});
            this.showToast('已加入购物车');
            this.taobaoModal.selectedItem = null;
        },
        removeFromCart(idx) {
            this.taobaoModal.cartItems.splice(idx, 1);
        },
        checkoutCart() {
            if(!this.taobaoModal.cartItems || this.taobaoModal.cartItems.length === 0) return;
            const names = this.taobaoModal.cartItems.map(i => i.name).join('、');
            const total = this.getCartTotal();
            
            this.taobaoModal.selectedItem = {
                store: '多商家合并结算',
                name: names.length > 18 ? names.substring(0, 18) + ' 等...' : names,
                price: total,
                desc: '购物车合并结算订单'
            };
            this.taobaoPayTargetModal.show = true;
        },
        payTaobao() {
            if (!this.taobaoModal.selectedItem) return;
            this.taobaoPayTargetModal.show = true;
        },
        confirmPayTaobao(target) {
            const item = this.taobaoModal.selectedItem;
            const amt = parseFloat(item.price);
            if (this.wallet.balance < amt) {
                this.showToast('余额不足，请先充值');
                return;
            }
            this.$emit('add-to-wallet', 'expense', amt, '桃宝购物', `购买 ${item.name}`);
            
            if (this.wechatState.activeSession) {
                const session = this.wechatState.activeSession;
                let msgContent = '';
                
                if (target === 'self') {
                    msgContent = `我给自己在桃宝买了：${item.name}。`;
                    session.messages.push({
                        type: 'text',
                        content: msgContent,
                        isSelf: true,
                        time: Date.now(),
                        avatar: this.getMaskById(session.maskId).avatar
                    });
                } else {
                    // 复用 food_delivery 卡片样式，但文案偏向网购
                    session.messages.push({
                        type: 'food_delivery',
                        item: `${item.store} - ${item.name}`,
                        amount: item.price,
                        remark: this.taobaoModal.note || '',
                        eta: '约3天送达',
                        isSelf: true,
                        time: Date.now(),
                        avatar: this.getMaskById(session.maskId).avatar
                    });
                }
                session.lastMessage = '[桃宝订单]';
                this.$emit('scroll-to-bottom');
            }
            
            this.taobaoPayTargetModal.show = false;
            this.taobaoModal.selectedItem = null;
            this.taobaoModal.cartItems = [];
            this.saveData();
            this.showToast('购买成功');
        }
    },
    template: `
        <div class="absolute inset-0 z-[1000] bg-[#f2f2f6] flex flex-col font-sans pb-safe">
            <header class="h-[90px] pt-10 px-4 flex items-center justify-between bg-[#ff5000] text-white border-b border-[#ff5000] shrink-0 z-50 sticky top-0">
                <button @click="taobaoModal.activeTab === 'search' ? (taobaoModal.activeTab = 'home') : closeApp()" class="w-8 h-8 flex items-center justify-center active:opacity-50"><i class="fas fa-chevron-left text-lg"></i></button>
                <h1 class="font-bold text-[17px] absolute left-1/2 -translate-x-1/2">{{ taobaoModal.activeTab === 'search' ? '搜索' : (taobaoModal.activeTab === 'home' ? '桃宝' : (taobaoModal.activeTab === 'cart' ? '购物车' : '我的')) }}</h1>
                <button v-if="taobaoModal.activeTab === 'home'" @click="refreshTaobaoItems" class="w-8 h-8 flex items-center justify-center active:opacity-50"><i class="fas fa-sync-alt"></i></button>
                <div v-else class="w-8"></div>
            </header>

            <div class="flex-1 overflow-y-auto pb-6 relative">
                <!-- 首页 -->
                <div v-if="taobaoModal.activeTab === 'home'" class="flex flex-col bg-[#f2f2f6] min-h-full">
                    <div class="pt-4 px-4 pb-2 bg-[#f2f2f6]">
                        <div class="bg-white rounded-[10px] flex items-center px-3 h-9 shadow-sm border border-orange-100 cursor-text" @click="taobaoModal.activeTab = 'search'; taobaoModal.searchResults=[]; taobaoModal.searchKeyword='';">
                            <i class="fas fa-search text-orange-400 mr-2 text-[14px]"></i>
                            <div class="text-gray-400 text-[14px]">寻找宝贝店铺...</div>
                        </div>
                    </div>

                    <div class="px-4 py-2 bg-[#f2f2f6] z-10 sticky top-0">
                        <div class="bg-white/80 backdrop-blur-md rounded-full p-1 flex items-center justify-between shadow-sm border border-gray-200/60">
                            <div v-for="cat in ['服饰', '数码', '美妆', '零食', '日用']" :key="cat"
                                 class="flex-1 text-center py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer"
                                 :class="taobaoModal.activeCategory === cat ? 'bg-[#ff5000] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'"
                                 @click="taobaoModal.activeCategory = cat">
                                {{ cat }}
                            </div>
                        </div>
                    </div>

                    <div v-if="taobaoModal.hotSales && taobaoModal.hotSales.length > 0" class="px-4 mb-2 mt-2">
                        <div class="text-[15px] font-bold text-gray-900 tracking-wide flex items-center gap-1.5 ml-1 mb-2">猜你喜欢 <i class="fas fa-heart text-[#ff5000] text-sm"></i></div>
                        <div class="flex overflow-x-auto gap-3 scrollbar-hide">
                            <div v-for="(item, idx) in taobaoModal.hotSales.filter(s => s.category === taobaoModal.activeCategory).slice(0, 5)" :key="'hot'+idx" @click="openTaobaoItem(item, item.storeName)" class="w-32 shrink-0 bg-white rounded-2xl p-2 border border-gray-100 shadow-sm cursor-pointer active:scale-95 transition">
                                <div class="w-full h-20 bg-gray-100 rounded-xl mb-2 flex items-center justify-center text-orange-200 relative overflow-hidden">
                                    <i class="fas fa-shopping-bag text-2xl opacity-50"></i>
                                    <div class="absolute top-0 left-0 bg-[#ff5000] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg">热销</div>
                                </div>
                                <div class="text-[13px] font-bold text-gray-800 truncate w-full">{{ item.name }}</div>
                                <div class="flex justify-between items-center mt-1">
                                    <span class="text-[14px] font-bold text-[#ff5000] font-mono">¥{{ item.price }}</span>
                                    <span class="text-[9px] text-gray-400 bg-gray-50 px-1 rounded">{{ item.sales }}+ 人付款</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="px-4 space-y-3 pb-4 pt-2">
                        <div class="text-[15px] font-bold text-gray-900 tracking-wide flex items-center gap-1.5 ml-1 mb-1">精选店铺</div>
                        <div v-for="store in (taobaoModal.storeList ||[]).filter(s => s.category === taobaoModal.activeCategory)" :key="store.id" class="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
                            <div class="flex items-center gap-3 border-b border-gray-50 pb-3">
                                <div class="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-400 shrink-0"><i class="fas fa-store"></i></div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-[15px] text-gray-900">{{ store.name }}</span>
                                    <span class="text-[10px] text-gray-400">{{ store.tag }} · 官方认证</span>
                                </div>
                            </div>
                            <div class="flex overflow-x-auto gap-3 scrollbar-hide">
                                <div v-for="(item, idx) in store.items" :key="idx" @click="openTaobaoItem(item, store.name)" class="w-28 shrink-0 flex flex-col gap-1 cursor-pointer active:scale-95 transition">
                                    <div class="w-28 h-20 bg-gray-100 rounded-xl overflow-hidden border border-gray-50 flex items-center justify-center text-orange-200"><i class="fas fa-box-open"></i></div>
                                    <span class="text-[12px] font-medium text-gray-800 truncate">{{ item.name }}</span>
                                    <div class="flex items-center justify-between">
                                        <span class="text-[13px] font-bold text-[#ff5000] font-mono">¥{{ item.price }}</span>
                                        <span class="text-[9px] text-gray-400">{{ item.sales }}+ 付款</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 搜索页 -->
                <div v-if="taobaoModal.activeTab === 'search'" class="flex flex-col bg-[#f2f2f6] min-h-full">
                    <div class="pt-4 px-4 pb-2 bg-[#f2f2f6] flex items-center gap-2 z-10 sticky top-0">
                        <div class="bg-white rounded-[10px] flex items-center px-3 h-9 shadow-sm border border-orange-200 flex-1">
                            <i class="fas fa-search text-gray-400 mr-2 text-[14px]"></i>
                            <input v-model="taobaoModal.searchKeyword" @keyup.enter="doTaobaoSearch" placeholder="搜索宝贝..." class="bg-transparent flex-1 outline-none text-[14px] text-gray-800" autofocus>
                            <i v-if="taobaoModal.searchKeyword" @click="taobaoModal.searchKeyword=''; taobaoModal.activeTab='home'" class="fas fa-times-circle text-gray-300 ml-2 cursor-pointer"></i>
                        </div>
                        <button @click="doTaobaoSearch" class="text-sm font-bold text-gray-800 px-2 active:opacity-50">搜索</button>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto px-4 pb-10">
                        <div v-if="taobaoModal.isSearching" class="flex flex-col items-center justify-center mt-32 text-gray-400">
                            <i class="fas fa-spinner fa-spin text-3xl mb-4 text-[#ff5000]"></i>
                            <span class="text-sm font-bold tracking-widest">寻找商品中...</span>
                        </div>
                        <div v-else-if="taobaoModal.searchResults.length > 0" class="space-y-3 mt-2">
                            <div class="text-[13px] font-bold text-gray-500 mb-2">搜索结果</div>
                            <div v-for="(item, idx) in taobaoModal.searchResults" :key="'sr'+idx" @click="openTaobaoItem(item, item.store)" class="bg-white rounded-[16px] p-3 shadow-sm border border-gray-100 flex gap-3 cursor-pointer active:bg-gray-50">
                                <div class="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-orange-200 shrink-0"><i class="fas fa-shopping-bag"></i></div>
                                <div class="flex flex-col flex-1 min-w-0 py-0.5">
                                    <span class="font-bold text-[15px] text-gray-900 truncate">{{ item.name }}</span>
                                    <span class="text-[11px] text-gray-500 mt-1 truncate"><i class="fas fa-store mr-1 text-gray-300"></i>{{ item.store }}</span>
                                    <div class="mt-auto flex justify-between items-center">
                                        <span class="text-[16px] font-bold text-[#ff5000] font-mono">¥{{ item.price }}</span>
                                        <span class="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{{ item.sales }}+ 人付款</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center text-gray-400 text-sm mt-32">
                            <i class="fas fa-search text-4xl mb-4 opacity-20 block"></i>
                            输入你想购买的商品吧
                        </div>
                    </div>
                </div>

                <!-- 购物车 -->
                <div v-if="taobaoModal.activeTab === 'cart'" class="flex-1 flex flex-col bg-[#f2f2f6] overflow-hidden">
                    <div class="px-4 py-3 flex items-center justify-between border-b border-gray-200 bg-[#f9f9f9] shrink-0">
                        <span class="font-bold text-[16px] text-gray-900">购物车 ({{ (taobaoModal.cartItems || []).length }})</span>
                        <span v-if="(taobaoModal.cartItems || []).length > 0" @click="taobaoModal.cartItems = []" class="text-[13px] text-gray-500 cursor-pointer active:opacity-50 flex items-center gap-1"><i class="far fa-trash-alt"></i> 管理</span>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-4">
                        <div v-if="(taobaoModal.cartItems || []).length === 0" class="flex flex-col items-center justify-center mt-32 text-gray-400">
                            <i class="fas fa-shopping-cart text-4xl mb-4 opacity-20"></i>
                            <span class="text-sm font-medium tracking-wide">购物车空空如也，去逛逛吧</span>
                        </div>
                        <div v-else class="space-y-3">
                            <div v-for="(item, idx) in (taobaoModal.cartItems || [])" :key="'cart'+idx" class="bg-white rounded-[16px] p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                                <div class="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-orange-200 shrink-0"><i class="fas fa-box-open"></i></div>
                                <div class="flex flex-col flex-1 min-w-0 py-0.5">
                                    <span class="font-bold text-[15px] text-gray-900 truncate">{{ item.name }}</span>
                                    <span class="text-[11px] text-gray-500 mt-0.5 truncate"><i class="fas fa-store text-gray-300 mr-1"></i>{{ item.store }}</span>
                                    <div class="mt-auto flex justify-between items-center w-full">
                                        <span class="text-[15px] font-bold text-[#ff5000] font-mono">¥{{ item.price }}</span>
                                        <i class="fas fa-minus-circle text-gray-300 cursor-pointer active:text-red-500 p-2 -mr-2" @click="removeFromCart(idx)"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="(taobaoModal.cartItems || []).length > 0" class="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] flex justify-between items-center z-20">
                        <div class="flex flex-col ml-3">
                            <span class="text-[11px] text-gray-500 mb-0.5">合计金额</span>
                            <span class="text-[20px] font-bold text-[#ff5000] font-mono leading-none">¥{{ getCartTotal() }}</span>
                        </div>
                        <button @click="checkoutCart" class="bg-[#ff5000] text-white px-8 py-2.5 rounded-xl font-bold text-[14px] active:scale-95 transition shadow-md flex items-center gap-1.5">去结算</button>
                    </div>
                </div>

                <!-- 我的 -->
                <div v-if="taobaoModal.activeTab === 'me'" class="flex flex-col bg-[#f5f5f5] min-h-full pb-10">
                    <div class="bg-gradient-to-b from-[#ff8c00] to-[#f5f5f5] pt-8 px-4 pb-2">
                        <div class="flex justify-end gap-4 text-white text-[18px] mb-2 pr-2">
                            <i class="fas fa-cog"></i>
                        </div>
                        <div class="flex items-center gap-4 px-2 mb-6">
                            <div class="w-[60px] h-[60px] rounded-full overflow-hidden bg-white border-2 border-white shadow-sm shrink-0">
                                <img :src="homeProfile.avatar" class="w-full h-full object-cover">
                            </div>
                            <div class="flex flex-col">
                                <span class="font-bold text-[20px] text-gray-900">{{ homeProfile.name }}</span>
                                <span class="text-[12px] text-gray-700 mt-1 flex items-center gap-1">淘气值 890</span>
                            </div>
                        </div>
                    </div>

                    <div class="px-3 space-y-3 -mt-2 z-10">
                        <div class="bg-white rounded-[16px] p-4 flex justify-around items-center shadow-sm">
                            <div class="flex flex-col items-center gap-2">
                                <i class="far fa-star text-[22px] text-gray-700"></i>
                                <span class="text-[12px] text-gray-700 font-medium">收藏夹</span>
                            </div>
                            <div class="flex flex-col items-center gap-2">
                                <i class="fas fa-store text-[22px] text-gray-700"></i>
                                <span class="text-[12px] text-gray-700 font-medium">关注店铺</span>
                            </div>
                            <div class="flex flex-col items-center gap-2">
                                <i class="fas fa-history text-[22px] text-gray-700"></i>
                                <span class="text-[12px] text-gray-700 font-medium">足迹</span>
                            </div>
                            <div class="flex flex-col items-center gap-2">
                                <i class="fas fa-ticket-alt text-[22px] text-gray-700"></i>
                                <span class="text-[12px] text-gray-700 font-medium">红包卡券</span>
                            </div>
                        </div>

                        <div class="bg-white rounded-[16px] p-4 shadow-sm">
                            <div class="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                                <span class="font-bold text-[15px] text-gray-900">我的订单</span>
                                <span class="text-[11px] text-gray-400">查看全部订单 <i class="fas fa-chevron-right text-[9px]"></i></span>
                            </div>
                            <div class="flex justify-around items-center">
                                <div class="flex flex-col items-center gap-2"><i class="fas fa-wallet text-[24px] text-gray-700"></i><span class="text-[12px] text-gray-700 font-medium">待付款</span></div>
                                <div class="flex flex-col items-center gap-2"><i class="fas fa-box text-[24px] text-gray-700"></i><span class="text-[12px] text-gray-700 font-medium">待发货</span></div>
                                <div class="flex flex-col items-center gap-2"><i class="fas fa-truck text-[24px] text-gray-700"></i><span class="text-[12px] text-gray-700 font-medium">待收货</span></div>
                                <div class="flex flex-col items-center gap-2"><i class="far fa-comment-dots text-[24px] text-gray-700"></i><span class="text-[12px] text-gray-700 font-medium">待评价</span></div>
                                <div class="flex flex-col items-center gap-2"><i class="fas fa-hand-holding-usd text-[24px] text-gray-700"></i><span class="text-[12px] text-gray-700 font-medium">退款/售后</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 商品详情弹窗 -->
            <transition name="app-slide">
                <div v-if="taobaoModal.selectedItem" class="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm flex flex-col justify-end" @click="taobaoModal.selectedItem = null">
                    <div class="bg-[#f2f2f6] w-full rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" @click.stop>
                        <div class="bg-white p-5 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
                            <span class="font-bold text-[16px] text-gray-900">商品详情</span>
                            <i class="fas fa-times text-gray-400 cursor-pointer text-lg p-1" @click="taobaoModal.selectedItem = null"></i>
                        </div>
                        <div class="p-5 overflow-y-auto bg-white flex-1">
                            <div class="w-full aspect-[4/3] bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-orange-200 mb-5 border border-gray-50 shadow-inner cursor-pointer active:opacity-70 transition relative" @click="showTaobaoDesc">
                                <i class="fas fa-shopping-bag text-5xl"></i>
                                <span class="text-[11px] mt-4 opacity-60 bg-gray-200/50 px-3 py-1 rounded-full text-gray-600"><i class="fas fa-search-plus"></i> 点击查看商品全景展示</span>
                            </div>
                            <div class="text-3xl font-bold font-mono text-[#ff5000] mb-3">¥{{ taobaoModal.selectedItem.price }}</div>
                            <h2 class="text-xl font-bold text-gray-900 mb-2">{{ taobaoModal.selectedItem.name }}</h2>
                            <div class="flex items-center justify-between text-sm text-gray-500 mb-4 border-b border-gray-50 pb-3">
                                <span>快递：免运费</span>
                                <span>月销 {{ taobaoModal.selectedItem.sales || '500+' }}</span>
                                <span>{{ taobaoModal.selectedItem.store }}发货</span>
                            </div>
                            
                            <div class="bg-gray-50 rounded-xl p-4 text-[13px] text-gray-600 leading-relaxed border border-gray-100">
                                <span class="font-bold text-gray-800 text-[14px] flex items-center gap-1.5 mb-2"><i class="fas fa-info-circle text-orange-400"></i> 宝贝简介</span>
                                {{ taobaoModal.selectedItem.desc }}
                            </div>
                        </div>
                        <div class="bg-white p-5 pt-3 border-t border-gray-100 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-10 flex flex-col gap-3">
                            <input v-model="taobaoModal.note" placeholder="订单备注 (选填)" class="w-full bg-[#f2f2f6] p-3 rounded-xl text-[14px] border border-gray-200 outline-none text-gray-700 font-medium focus:border-black transition">
                            <div class="flex gap-2 w-full">
                                <button @click="addToCart" class="flex-1 py-3 rounded-xl bg-orange-100 text-[#ff5000] font-bold text-[14px] active:scale-95 transition shadow-sm flex items-center justify-center gap-1.5">
                                    加入购物车
                                </button>
                                <button @click="payTaobao" class="flex-1 py-3 rounded-xl bg-[#ff5000] text-white font-bold text-[14px] active:scale-95 transition shadow-md flex items-center justify-center gap-1.5">
                                    立即购买
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- 描述弹窗 -->
            <transition name="scale">
                <div v-if="taobaoDescModal && taobaoDescModal.show" class="fixed inset-0 z-[120000] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click="taobaoDescModal.show = false">
                    <div class="bg-[#f2f2f6] w-[80%] rounded-[20px] overflow-hidden shadow-2xl flex flex-col" @click.stop>
                        <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-[#f9f9f9]">
                            <span class="font-bold text-[15px] text-gray-900">商品外观描述</span>
                            <i class="fas fa-times text-gray-400 cursor-pointer active:opacity-50" @click="taobaoDescModal.show = false"></i>
                        </div>
                        <div class="p-6 min-h-[140px] flex items-center justify-center text-[14px] text-gray-700 leading-relaxed text-justify bg-white">
                            {{ taobaoDescModal.content }}
                        </div>
                        <div class="p-4 border-t border-gray-200 bg-[#f9f9f9] flex justify-center">
                            <button @click="taobaoDescModal.show = false" class="w-full bg-[#ff5000] border border-gray-200 text-white py-2.5 rounded-[12px] text-[15px] font-bold shadow-sm active:scale-95 transition">确定</button>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- 选择代付对象 -->
            <transition name="scale">
                <div v-if="taobaoPayTargetModal.show" class="fixed inset-0 z-[120000] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click="taobaoPayTargetModal.show = false">
                    <div class="bg-[#f2f2f6] w-[80%] rounded-[20px] overflow-hidden shadow-2xl flex flex-col" @click.stop>
                        <div class="p-4 border-b border-gray-200 text-center bg-[#f9f9f9]">
                            <span class="font-bold text-[15px] text-gray-900">请选择付款方式</span>
                        </div>
                        <div class="p-3 bg-white flex flex-col gap-2">
                            <button @click="confirmPayTaobao('self')" class="w-full py-3.5 bg-gray-50 rounded-xl text-[15px] font-bold text-gray-800 active:bg-gray-100 transition border border-gray-100">自己购买</button>
                            <button v-if="wechatState.activeSession" @click="confirmPayTaobao('ai')" class="w-full py-3.5 bg-gray-50 rounded-xl text-[15px] font-bold text-gray-800 active:bg-gray-100 transition border border-gray-100">发送代付给 {{ wechatState.activeSession?.isGroup ? '群聊' : wechatState.activeSession?.name }}</button>
                        </div>
                        <div class="p-3 border-t border-gray-200 bg-[#f9f9f9]">
                            <button @click="taobaoPayTargetModal.show = false" class="w-full bg-white border border-gray-200 text-gray-500 py-2.5 rounded-[12px] text-[15px] font-bold shadow-sm active:scale-95 transition">取消</button>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- 底部导航 -->
            <div v-if="taobaoModal.activeTab !== 'search'" class="h-[75px] pt-1.5 bg-white border-t border-gray-200 flex items-center justify-around shrink-0 pb-safe z-50">
                <div @click="taobaoModal.activeTab = 'home'" class="flex flex-col items-center gap-1 cursor-pointer transition" :class="taobaoModal.activeTab === 'home' ? 'text-[#ff5000]' : 'text-gray-400'">
                    <i class="fas fa-home text-[22px]"></i><span class="text-[10px] font-bold">首页</span>
                </div>
                <div @click="taobaoModal.activeTab = 'cart'" class="flex flex-col items-center gap-1 cursor-pointer transition" :class="taobaoModal.activeTab === 'cart' ? 'text-[#ff5000]' : 'text-gray-400'">
                    <i class="fas fa-shopping-cart text-[22px]"></i><span class="text-[10px] font-bold">购物车</span>
                </div>
                <div @click="taobaoModal.activeTab = 'me'" class="flex flex-col items-center gap-1 cursor-pointer transition" :class="taobaoModal.activeTab === 'me' ? 'text-[#ff5000]' : 'text-gray-400'">
                    <i class="fas fa-user text-[22px]"></i><span class="text-[10px] font-bold">我的桃宝</span>
                </div>
            </div>
        </div>
    `
};
