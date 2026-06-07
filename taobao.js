const TaobaoApp = {
    props: ['wechatState', 'wallet', 'apiConfig', 'homeProfile', 'masks'],
    emits: ['close', 'toast', 'save-data', 'add-to-wallet', 'scroll-to-bottom'],
    data() {
        return {
            taobaoModal: { 
                activeTab: 'home', 
                activeCategory: '服饰', 
                takeoutCategory: '美食', 
                selectedItem: null, 
                storeList: [], 
                takeoutStoreList: [], 
                searchKeyword: '', 
                isSearching: false, 
                searchResults: [], 
                hotSales: [], 
                takeoutHotSales: [], 
                cartItems: [],
                msgTab: 'merchant' 
            },
            taobaoDescModal: { show: false, content: '', isGenerating: false },
            
            // 收货地址系统数据
            addresses: [],
            addressModal: { 
                showList: false, 
                showEdit: false, 
                isManageMode: false,
                editForm: this.getEmptyAddress()
            },
            showCustomTagInput: false,
            customTagValue: '',

            // 结算台与支付
            checkoutModal: { 
                show: false, 
                items: [], 
                totalPrice: '0.00', 
                note: '', 
                selectedAddressId: null,
                isDirectBuy: false
            },
            taobaoPayTargetModal: { show: false, isRequestPay: false }
        }
    },
    computed: {
        // 购物车按店铺分组
        groupedCart() {
            const groups = {};
            this.taobaoModal.cartItems.forEach(item => {
                if (!groups[item.store]) {
                    groups[item.store] = { storeName: item.store, items: [], selected: false };
                }
                groups[item.store].items.push(item);
            });
            // 检查店铺全选状态
            Object.values(groups).forEach(g => {
                g.selected = g.items.length > 0 && g.items.every(i => i.selected);
            });
            return Object.values(groups);
        },
        // 计算已勾选的总价
        selectedCartTotal() {
            return this.taobaoModal.cartItems
                .filter(i => i.selected)
                .reduce((sum, item) => sum + parseFloat(item.price), 0)
                .toFixed(2);
        },
        // 计算已勾选的数量
        selectedCartCount() {
            return this.taobaoModal.cartItems.filter(i => i.selected).length;
        },
        // 底部全选状态
        isAllSelected() {
            return this.taobaoModal.cartItems.length > 0 && this.taobaoModal.cartItems.every(i => i.selected);
        },
        // 当前选中的默认地址
        defaultAddress() {
            if (this.checkoutModal.selectedAddressId) {
                return this.addresses.find(a => a.id === this.checkoutModal.selectedAddressId) || this.addresses[0];
            }
            return this.addresses[0] || null;
        }
    },
    mounted() {
        this.refreshTaobaoItems();
        // 初始化本地存储的地址
        const savedAddresses = localStorage.getItem('aovein_taobao_addresses');
        if (savedAddresses) {
            try { this.addresses = JSON.parse(savedAddresses); } catch(e) {}
        }
    },
    methods: {
        closeApp() { this.$emit('close'); },
        showToast(msg) { this.$emit('toast', msg); },
        saveData() { this.$emit('save-data'); },
        saveAddressesToLocal() {
            localStorage.setItem('aovein_taobao_addresses', JSON.stringify(this.addresses));
        },
        getMaskById(id) {
            return this.masks.find(m => m.id === id) || { name: '我', avatar: 'https://pic1.imgdb.cn/item/69d5d388fe07599d0e204634.jpg', bio: '' };
        },
        refreshTaobaoItems() {
            // 桃宝数据
            this.taobaoModal.storeList = [
                { id: 1, category: '服饰', name: '优衣库官方旗舰店', tag: '品牌精选', items:[{name: '纯棉短袖T恤', price: '79.00'}, {name: '修身牛仔裤', price: '199.00'}, {name: '防晒轻薄外套', price: '149.00'}] },
                { id: 2, category: '数码', name: 'Apple产品官方旗舰店', tag: '正品保证', items:[{name: 'AirPods Pro 2', price: '1899.00'}, {name: '20W 充电头', price: '149.00'}, {name: 'MagSafe 保护壳', price: '399.00'}] },
                { id: 3, category: '美妆', name: '完美日记旗舰店', tag: '平价好物', items:[{name: '原石眼影盘', price: '119.00'}, {name: '持色唇釉', price: '69.00'}, {name: '定妆散粉', price: '89.00'}] },
                { id: 4, category: '零食', name: '三只松鼠旗舰店', tag: '吃货必逛', items:[{name: '每日坚果大礼包', price: '88.00'}, {name: '手撕面包一整箱', price: '29.90'}, {name: '芒果干', price: '25.00'}] },
                { id: 5, category: '日用', name: '无印良品旗舰店', tag: '生活百货', items:[{name: '香薰机', price: '199.00'}, {name: '极简收纳盒', price: '45.00'}, {name: '纯棉四件套', price: '299.00'}] }
            ];
            const merchantIntros = ['本店爆款推荐！材质优良，做工精细，好评率高达99%！', '官方正品保证！细节处理得恰到好处，保证让您惊艳！', '高性价比之选！兼顾美观与实用，设计感拉满！'];
            let allItems = [];
            this.taobaoModal.storeList.forEach(store => {
                store.items.forEach(item => {
                    item.cartId = Date.now() + Math.random();
                    item.sales = Math.floor(Math.random() * 8000 + 500);
                    item.desc = merchantIntros[Math.floor(Math.random() * merchantIntros.length)];
                    item.appearance = `一件包装精美的${item.name}，使用印有品牌Logo的快递盒仔细封装着。`; 
                    item.selected = true;
                    allItems.push({...item, storeName: store.name, category: store.category});
                });
            });
            allItems.sort(() => Math.random() - 0.5);
            this.taobaoModal.hotSales = allItems;

            // 外卖数据
            this.taobaoModal.takeoutStoreList = [
                { id: 1, category: '美食', name: 'Wagas 沃歌斯', tag: '健康轻食', items:[{name: '牛肉能量碗', price: '52.00'}, {name: '煎烤鸡肉沙拉', price: '45.00'}, {name: '意式肉酱面', price: '38.00'}] },
                { id: 2, category: '美食', name: 'KFC 肯德基', tag: '西式快餐', items:[{name: '麦辣鸡腿堡套餐', price: '38.00'}, {name: '原味鸡+薯条', price: '25.00'}, {name: '老北京卷', price: '18.00'}] },
                { id: 3, category: '美食', name: '老乡鸡', tag: '中式快餐', items:[{name: '肥西老母鸡汤', price: '18.00'}, {name: '梅菜扣肉', price: '22.00'}, {name: '葱油鸡', price: '20.00'}] },
                { id: 4, category: '饮品', name: '霸王茶姬', tag: '新中式奶茶', items:[{name: '伯牙绝弦', price: '20.00'}, {name: '春日桃桃', price: '18.00'}] },
                { id: 5, category: '日用品', name: '屈臣氏', tag: '便利超市', items:[{name: '洗脸巾', price: '15.00'}, {name: '洁面乳', price: '45.00'}] }
            ];
            let allTakeoutItems = [];
            this.taobaoModal.takeoutStoreList.forEach(store => {
                store.items.forEach(item => {
                    item.cartId = Date.now() + Math.random();
                    item.sales = Math.floor(Math.random() * 2000 + 2000);
                    item.desc = '严选新鲜食材，口感层次极其丰富！';
                    item.appearance = `一份刚出炉的${item.name}，被仔细装在环保外卖盒中。`; 
                    item.selected = true;
                    allTakeoutItems.push({...item, storeName: store.name, category: store.category});
                });
            });
            // 按照价格排序假装热销
            allTakeoutItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            this.taobaoModal.takeoutHotSales = allTakeoutItems;
        },
        openTaobaoItem(item, storeName) {
            this.taobaoModal.selectedItem = {
                cartId: Date.now() + Math.random(),
                store: storeName,
                name: item.name,
                price: item.price,
                sales: item.sales,
                desc: item.desc,
                appearance: item.appearance,
                selected: true
            };
        },
        doTaobaoSearch() {
            if (!this.taobaoModal.searchKeyword.trim()) return;
            this.taobaoModal.activeTab = 'search';
            this.taobaoModal.isSearching = true;
            setTimeout(() => {
                this.taobaoModal.isSearching = false;
                const results = [];
                const kw = this.taobaoModal.searchKeyword;
                for (let i = 0; i < 6; i++) {
                    results.push({
                        cartId: Date.now() + Math.random(),
                        store: "品牌旗舰店", name: kw + ' 热卖版', price: (Math.random() * 200 + 30).toFixed(2),
                        sales: Math.floor(Math.random() * 9000 + 100), desc: `关于${kw}的巅峰之作！`, appearance: `一件全新的${kw}`
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

        // --- 购物车交互逻辑 ---
        toggleStoreSelect(group) {
            const newVal = !group.selected;
            group.items.forEach(item => item.selected = newVal);
        },
        toggleAllSelect() {
            const newVal = !this.isAllSelected;
            this.taobaoModal.cartItems.forEach(item => item.selected = newVal);
        },
        addToCart() {
            if (!this.taobaoModal.selectedItem) return;
            this.taobaoModal.cartItems.unshift({...this.taobaoModal.selectedItem});
            this.showToast('已加入购物车');
            this.taobaoModal.selectedItem = null;
            this.saveData();
        },
        removeFromCart(item) {
            this.taobaoModal.cartItems = this.taobaoModal.cartItems.filter(i => i.cartId !== item.cartId);
            this.saveData();
        },

        // --- 收货地址管理逻辑 ---
        getEmptyAddress() {
            return { id: null, owner: 'me', region: '', detail: '', name: '', gender: '先生', phone: '', tag: '家' };
        },
        openAddressList() {
            this.addressModal.showList = true;
            this.addressModal.isManageMode = false;
        },
        addNewAddress() {
            this.addressModal.editForm = this.getEmptyAddress();
            this.addressModal.showEdit = true;
            this.showCustomTagInput = false;
        },
        editAddress(addr) {
            this.addressModal.editForm = JSON.parse(JSON.stringify(addr));
            this.addressModal.showEdit = true;
            this.showCustomTagInput = !['家', '公司', '学校'].includes(addr.tag);
            if (this.showCustomTagInput) this.customTagValue = addr.tag;
        },
        deleteAddress(id) {
            this.addresses = this.addresses.filter(a => a.id !== id);
            this.saveAddressesToLocal();
            this.showToast('地址已删除');
        },
        saveAddress() {
            const form = this.addressModal.editForm;
            if (!form.region || !form.detail || !form.name || !form.phone) return this.showToast('请将地址信息填写完整');
            
            if (this.showCustomTagInput && this.customTagValue) {
                form.tag = this.customTagValue;
            }

            if (form.id) {
                const idx = this.addresses.findIndex(a => a.id === form.id);
                if (idx > -1) this.addresses[idx] = { ...form };
            } else {
                form.id = 'addr_' + Date.now();
                this.addresses.push({ ...form });
            }
            this.saveAddressesToLocal();
            this.addressModal.showEdit = false;
            this.showToast('地址保存成功');
        },
        selectAddressForCheckout(addr) {
            this.checkoutModal.selectedAddressId = addr.id;
            this.addressModal.showList = false;
        },

        // --- 结算台与支付流程 ---
        openCheckout(source) {
            let itemsToBuy = [];
            let total = 0;

            if (source === 'cart') {
                itemsToBuy = this.taobaoModal.cartItems.filter(i => i.selected);
                if (itemsToBuy.length === 0) return this.showToast('请选择要结算的商品');
                total = this.selectedCartTotal;
                this.checkoutModal.isDirectBuy = false;
            } else if (source === 'direct') {
                if (!this.taobaoModal.selectedItem) return;
                itemsToBuy = [this.taobaoModal.selectedItem];
                total = this.taobaoModal.selectedItem.price;
                this.checkoutModal.isDirectBuy = true;
            }

            this.checkoutModal.items = itemsToBuy;
            this.checkoutModal.totalPrice = total;
            this.checkoutModal.note = '';
            // 如果没有选中地址，默认取第一个
            if (!this.checkoutModal.selectedAddressId && this.addresses.length > 0) {
                this.checkoutModal.selectedAddressId = this.addresses[0].id;
            }
            
            this.checkoutModal.show = true;
        },

        // 图二：发起代付
        requestPayment() {
            if (!this.taobaoModal.selectedItem) return;
            this.taobaoPayTargetModal.isRequestPay = true;
            // 把单件商品塞入 checkout 假装是列表
            this.checkoutModal.items = [this.taobaoModal.selectedItem];
            this.checkoutModal.totalPrice = this.taobaoModal.selectedItem.price;
            this.taobaoPayTargetModal.show = true;
        },

        // 结算台点击提交订单
        submitCheckout() {
            if (!this.defaultAddress) return this.showToast('请先选择或添加收货地址');
            this.taobaoPayTargetModal.isRequestPay = false;
            this.taobaoPayTargetModal.show = true;
        },

        confirmPayTaobao(target) {
            const totalAmt = parseFloat(this.checkoutModal.totalPrice);
            const isRequest = this.taobaoPayTargetModal.isRequestPay;

            // 1. 发起代付逻辑
            if (isRequest) {
                const item = this.checkoutModal.items[0];
                if (this.wechatState.activeSession) {
                    this.wechatState.activeSession.messages.push({
                        type: 'food_payment', // 复用代付卡片UI
                        item: `[代付请求] ${item.name}`,
                        amount: item.price,
                        status: 'pending',
                        isSelf: true,
                        time: Date.now(),
                        avatar: this.getMaskById(this.wechatState.activeSession.maskId).avatar
                    });
                    this.wechatState.activeSession.lastMessage = '[代付请求]';
                    this.$emit('scroll-to-bottom');
                }
                this.closeAllTaobaoModals();
                this.showToast('代付请求已发送');
                this.saveData();
                return;
            }

            // 2. 正常自己付款 / 让角色代付
            if (target === 'self') {
                if (this.wallet.balance < totalAmt) return this.showToast('余额不足，请先充值');
                this.$emit('add-to-wallet', 'expense', totalAmt, '桃宝购物', `桃宝订单合并付款`);
            }
            
            if (this.wechatState.activeSession) {
                const session = this.wechatState.activeSession;
                const itemNames = this.checkoutModal.items.map(i => i.name).join('、');
                const displayName = itemNames.length > 15 ? itemNames.substring(0, 15) + '...' : itemNames;

                if (target === 'self') {
                    session.messages.push({
                        type: 'text',
                        content: `我刚刚在桃宝买好了：${displayName}。`,
                        isSelf: true,
                        time: Date.now(),
                        avatar: this.getMaskById(session.maskId).avatar
                    });
                } else {
                    session.messages.push({
                        type: 'food_delivery', // 复用外卖卡片作为订单卡片
                        item: `[桃宝订单] ${displayName}`,
                        amount: totalAmt.toFixed(2),
                        remark: this.checkoutModal.note || '无备注',
                        eta: '预计3天送达',
                        isSelf: true,
                        time: Date.now(),
                        avatar: this.getMaskById(session.maskId).avatar
                    });
                }
                session.lastMessage = '[桃宝订单]';
                this.$emit('scroll-to-bottom');
            }
            
            // 购买成功后清理购物车
            if (!this.checkoutModal.isDirectBuy) {
                this.taobaoModal.cartItems = this.taobaoModal.cartItems.filter(i => !i.selected);
            }
            
            this.closeAllTaobaoModals();
            this.showToast('支付成功，等待发货');
            this.saveData();
        },

        closeAllTaobaoModals() {
            this.taobaoPayTargetModal.show = false;
            this.checkoutModal.show = false;
            this.taobaoModal.selectedItem = null;
        }
    },
    template: `
        <div class="absolute inset-0 z-[1000] bg-[#f2f2f6] flex flex-col font-sans pb-safe">
            <!-- 顶部导航 -->
            <header class="h-[90px] pt-10 px-4 flex items-center justify-between bg-[#f2f2f6] text-gray-900 border-b border-gray-200 shrink-0 z-50 sticky top-0">
                <button @click="taobaoModal.activeTab === 'search' ? (taobaoModal.activeTab = 'home') : closeApp()" class="w-8 h-8 flex items-center justify-center active:opacity-50"><i class="fas fa-chevron-left text-lg"></i></button>
                <h1 class="font-bold text-[17px] absolute left-1/2 -translate-x-1/2">{{ taobaoModal.activeTab === 'search' ? '搜索' : (taobaoModal.activeTab === 'home' ? '桃宝' : (taobaoModal.activeTab === 'takeout' ? '外卖' : (taobaoModal.activeTab === 'msg' ? '消息' : (taobaoModal.activeTab === 'cart' ? '购物车' : '我的桃宝')))) }}</h1>
                <button v-if="taobaoModal.activeTab === 'home' || taobaoModal.activeTab === 'takeout'" @click="refreshTaobaoItems" class="w-8 h-8 flex items-center justify-center active:opacity-50"><i class="fas fa-sync-alt"></i></button>
                <div v-else class="w-8"></div>
            </header>

            <div class="flex-1 overflow-y-auto pb-6 relative">
                <!-- ================= 首页 ================= -->
                <div v-if="taobaoModal.activeTab === 'home'" class="flex flex-col min-h-full">
                    <div class="pt-4 px-4 pb-2 bg-[#f2f2f6]">
                        <div class="bg-white rounded-[10px] flex items-center px-3 h-9 shadow-sm border border-gray-100 cursor-text" @click="taobaoModal.activeTab = 'search'; taobaoModal.searchResults=[]; taobaoModal.searchKeyword='';">
                            <i class="fas fa-search text-gray-400 mr-2 text-[14px]"></i>
                            <div class="text-gray-400 text-[14px]">寻找宝贝、店铺...</div>
                        </div>
                    </div>
                    <!-- 分类 -->
                    <div class="px-4 py-2 z-10 sticky top-0 bg-[#f2f2f6]">
                        <div class="bg-white/80 backdrop-blur-md rounded-full p-1 flex items-center justify-between shadow-sm border border-gray-200/60">
                            <div v-for="cat in ['服饰', '数码', '美妆', '零食', '日用']" :key="cat"
                                 class="flex-1 text-center py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer"
                                 :class="taobaoModal.activeCategory === cat ? 'bg-[#ff5000] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'"
                                 @click="taobaoModal.activeCategory = cat">
                                {{ cat }}
                            </div>
                        </div>
                    </div>
                    <!-- 列表 -->
                    <div class="px-4 space-y-3 pb-4">
                        <div v-for="store in (taobaoModal.storeList ||[]).filter(s => s.category === taobaoModal.activeCategory)" :key="store.id" class="bg-white rounded-[16px] p-4 shadow-sm">
                            <div class="flex items-center gap-3 border-b border-gray-50 pb-3">
                                <div class="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><i class="fas fa-store"></i></div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-[15px] text-gray-900">{{ store.name }}</span>
                                    <span class="text-[10px] text-gray-400">官方认证 · 品牌好店</span>
                                </div>
                            </div>
                            <div class="flex overflow-x-auto gap-3 scrollbar-hide mt-3">
                                <div v-for="(item, idx) in store.items" :key="idx" @click="openTaobaoItem(item, store.name)" class="w-28 shrink-0 flex flex-col gap-1 cursor-pointer active:scale-95 transition">
                                    <div class="w-28 h-28 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center text-orange-200"><i class="fas fa-box-open text-3xl"></i></div>
                                    <span class="text-[12px] text-gray-800 line-clamp-2 mt-1">{{ item.name }}</span>
                                    <span class="text-[14px] font-bold text-[#ff5000] font-mono mt-auto">¥{{ item.price }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ================= 购物车 (支持店铺分组多选) ================= -->
                <div v-if="taobaoModal.activeTab === 'cart'" class="flex-1 flex flex-col min-h-full">
                    <div class="px-4 py-3 flex justify-between items-center bg-white shrink-0">
                        <span class="font-bold text-[18px]">购物车 ({{ taobaoModal.cartItems.length }})</span>
                        <span @click="taobaoModal.cartItems = []" class="text-[13px] text-gray-500">清空</span>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-3">
                        <div v-if="taobaoModal.cartItems.length === 0" class="text-center text-gray-400 mt-32">
                            <i class="fas fa-shopping-cart text-5xl mb-4 opacity-20"></i>
                            <p>购物车还是空的，快去挑好物吧</p>
                        </div>
                        
                        <!-- 按店铺渲染购物车 -->
                        <div v-for="(group, gIdx) in groupedCart" :key="gIdx" class="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                            <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                                <!-- 店铺全选框 -->
                                <div @click="toggleStoreSelect(group)" class="w-5 h-5 rounded-full border flex items-center justify-center transition" :class="group.selected ? 'bg-[#ff5000] border-[#ff5000]' : 'border-gray-300'">
                                    <i v-if="group.selected" class="fas fa-check text-white text-[10px]"></i>
                                </div>
                                <i class="fas fa-store text-gray-400 text-sm"></i>
                                <span class="font-bold text-[14px] text-gray-900">{{ group.storeName }}</span>
                                <i class="fas fa-chevron-right text-gray-300 text-xs"></i>
                            </div>
                            
                            <!-- 商品列表 -->
                            <div v-for="(item, iIdx) in group.items" :key="item.cartId" class="flex items-center gap-3 mb-4 last:mb-0 relative">
                                <!-- 单选框 -->
                                <div @click="item.selected = !item.selected" class="w-5 h-5 rounded-full border flex items-center justify-center transition shrink-0" :class="item.selected ? 'bg-[#ff5000] border-[#ff5000]' : 'border-gray-300'">
                                    <i v-if="item.selected" class="fas fa-check text-white text-[10px]"></i>
                                </div>
                                <div class="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center text-orange-200 shrink-0"><i class="fas fa-image text-2xl"></i></div>
                                <div class="flex flex-col flex-1 min-w-0 h-20 py-1">
                                    <span class="text-[13px] text-gray-800 line-clamp-2">{{ item.name }}</span>
                                    <div class="mt-auto flex justify-between items-end w-full">
                                        <span class="text-[16px] font-bold text-[#ff5000] font-mono leading-none">¥{{ item.price }}</span>
                                        <i class="far fa-trash-alt text-gray-300 cursor-pointer p-2 -mr-2" @click="removeFromCart(item)"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- ================= 外卖 ================= -->
                <div v-if="taobaoModal.activeTab === 'takeout'" class="flex flex-col bg-[#f5f5f5] min-h-full">
                    <!-- 搜索栏 -->
                    <div class="pt-2 px-4 pb-2 bg-[#f5f5f5]">
                        <div class="bg-white rounded-full flex items-center px-4 h-10 shadow-sm border border-gray-100 cursor-text" @click="taobaoModal.activeTab = 'search'; taobaoModal.searchResults=[]; taobaoModal.searchKeyword='';">
                            <i class="fas fa-search text-gray-400 mr-2 text-[14px]"></i>
                            <div class="text-gray-400 text-[14px]">搜外卖、搜商家...</div>
                        </div>
                    </div>

                    <!-- 分类 Tab -->
                    <div class="px-4 py-2 z-10 sticky top-0 bg-[#f5f5f5]">
                        <div class="bg-white rounded-full p-1 flex items-center justify-between shadow-sm">
                            <div v-for="cat in ['美食', '蔬果', '饮品', '日用品', '其他']" :key="cat"
                                 class="flex-1 text-center py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer"
                                 :class="taobaoModal.takeoutCategory === cat ? 'bg-[#2c2c2e] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'"
                                 @click="taobaoModal.takeoutCategory = cat">
                                {{ cat }}
                            </div>
                        </div>
                    </div>

                    <!-- 本周热销 -->
                    <div v-if="taobaoModal.takeoutHotSales && taobaoModal.takeoutHotSales.length > 0" class="px-4 mb-2 mt-2">
                        <div class="text-[16px] font-bold text-gray-900 tracking-wide flex items-center gap-1.5 mb-3">本周热销 <i class="fas fa-fire text-red-500 text-sm"></i></div>
                        <div class="flex overflow-x-auto gap-3 scrollbar-hide">
                            <div v-for="(item, idx) in taobaoModal.takeoutHotSales.filter(s => s.category === taobaoModal.takeoutCategory).slice(0, 5)" :key="'hot'+idx" @click="openTaobaoItem(item, item.storeName)" class="w-[130px] shrink-0 bg-white rounded-[16px] p-2.5 shadow-sm cursor-pointer active:scale-95 transition">
                                <div class="w-full h-24 bg-[#f9f9f9] rounded-xl mb-3 flex items-center justify-center text-gray-200 relative overflow-hidden">
                                    <i class="fas fa-crown text-4xl opacity-40"></i>
                                    <div class="absolute top-0 left-0 bg-[#ff4d4f] text-white text-[10px] font-bold px-2 py-0.5 rounded-br-xl rounded-tl-xl">TOP {{ idx + 1 }}</div>
                                </div>
                                <div class="text-[14px] font-bold text-gray-900 truncate w-full mb-1">{{ item.name }}</div>
                                <div class="flex justify-between items-center mt-1">
                                    <span class="text-[15px] font-bold text-gray-900 font-mono">¥{{ item.price }}</span>
                                    <span class="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">售{{ item.sales }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 附近推荐 -->
                    <div class="px-4 space-y-4 pb-4 pt-3">
                        <div class="text-[16px] font-bold text-gray-900 tracking-wide flex items-center gap-1.5 mb-1">附近推荐</div>
                        <div v-for="store in (taobaoModal.takeoutStoreList ||[]).filter(s => s.category === taobaoModal.takeoutCategory)" :key="store.id" class="bg-white rounded-[16px] p-4 shadow-sm flex flex-col gap-3">
                            <div class="flex items-center gap-3 border-b border-gray-50 pb-3">
                                <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"><i class="fas fa-store text-xl"></i></div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-[16px] text-gray-900">{{ store.name }}</span>
                                    <span class="text-[11px] text-gray-500 mt-0.5">{{ store.tag }} · 30分钟送达</span>
                                </div>
                            </div>
                            <div class="flex overflow-x-auto gap-3 scrollbar-hide">
                                <div v-for="(item, idx) in store.items" :key="idx" @click="openTaobaoItem(item, store.name)" class="w-[105px] shrink-0 flex flex-col gap-1 cursor-pointer active:scale-95 transition">
                                    <div class="w-full h-[105px] bg-[#f9f9f9] rounded-xl overflow-hidden flex items-center justify-center text-gray-300"><i class="fas fa-utensils text-3xl"></i></div>
                                    <span class="text-[13px] font-medium text-gray-900 truncate mt-1">{{ item.name }}</span>
                                    <div class="flex items-center justify-between">
                                        <span class="text-[14px] font-bold text-gray-900 font-mono">¥{{ item.price }}</span>
                                        <span class="text-[10px] text-gray-400">售{{ item.sales }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ================= 消息 ================= -->
                <div v-if="taobaoModal.activeTab === 'msg'" class="flex flex-col bg-[#f5f5f5] min-h-full">
                    <div class="px-4 py-3 z-10 sticky top-0 bg-[#f5f5f5] flex justify-center">
                        <div class="bg-gray-200/80 p-1 rounded-[10px] flex items-center w-[60%]">
                            <div class="flex-1 text-center py-1.5 rounded-md text-[14px] font-bold transition-all cursor-pointer"
                                 :class="taobaoModal.msgTab === 'merchant' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
                                 @click="taobaoModal.msgTab = 'merchant'">商家</div>
                            <div class="flex-1 text-center py-1.5 rounded-md text-[14px] font-bold transition-all cursor-pointer"
                                 :class="taobaoModal.msgTab === 'rider' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
                                 @click="taobaoModal.msgTab = 'rider'">骑手</div>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto px-4 pt-10">
                        <div v-if="taobaoModal.msgTab === 'merchant'" class="flex flex-col items-center justify-center text-gray-400">
                            <i class="fas fa-store text-5xl mb-4 opacity-20"></i>
                            <span class="text-sm font-medium tracking-wide">暂无商家消息</span>
                        </div>
                        <div v-else class="flex flex-col items-center justify-center text-gray-400">
                            <i class="fas fa-motorcycle text-5xl mb-4 opacity-20"></i>
                            <span class="text-sm font-medium tracking-wide">暂无骑手消息</span>
                        </div>
                    </div>
                </div>
                    
                    <!-- 购物车底部结算栏 -->
                    <div v-if="taobaoModal.cartItems.length > 0" class="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2 pl-4 pr-3 flex justify-between items-center z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        <div class="flex items-center gap-2" @click="toggleAllSelect">
                            <div class="w-5 h-5 rounded-full border flex items-center justify-center transition" :class="isAllSelected ? 'bg-[#ff5000] border-[#ff5000]' : 'border-gray-300'">
                                <i v-if="isAllSelected" class="fas fa-check text-white text-[10px]"></i>
                            </div>
                            <span class="text-sm text-gray-600">全选</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="flex flex-col items-end">
                                <div class="text-[12px] text-gray-600">合计: <span class="text-[18px] font-bold text-[#ff5000] font-mono">¥{{ selectedCartTotal }}</span></div>
                            </div>
                            <button @click="openCheckout('cart')" class="bg-gradient-to-r from-[#ff9000] to-[#ff5000] text-white px-6 py-2.5 rounded-full font-bold text-[14px] shadow-md active:scale-95 transition">结算({{ selectedCartCount }})</button>
                        </div>
                    </div>
                </div>

                <!-- ================= 我的桃宝 (包含收货地址入口) ================= -->
                <div v-if="taobaoModal.activeTab === 'me'" class="flex flex-col min-h-full pb-10">
                    <div class="bg-gradient-to-b from-[#ff8c00] to-[#f2f2f6] pt-8 px-4 pb-4">
                        <div class="flex items-center gap-4 px-2 mb-4">
                            <div class="w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm shrink-0">
                                <img :src="homeProfile.avatar" class="w-full h-full object-cover">
                            </div>
                            <div class="flex flex-col">
                                <span class="font-bold text-[20px] text-gray-900">{{ homeProfile.name }}</span>
                                <span class="text-[12px] bg-black/10 text-black/60 px-2 py-0.5 rounded-full mt-1 w-fit">淘气值 890</span>
                            </div>
                        </div>
                    </div>

                    <div class="px-4 space-y-3 z-10 -mt-2">
                        <!-- 收货地址入口 -->
                        <div class="bg-white rounded-[16px] p-4 shadow-sm flex items-center justify-between cursor-pointer active:bg-gray-50" @click="openAddressList">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-map-marker-alt text-[#ff5000] text-lg w-5 text-center"></i>
                                <span class="font-bold text-[15px] text-gray-800">我的收货地址</span>
                            </div>
                            <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
                        </div>

                        <div class="bg-white rounded-[16px] p-4 shadow-sm">
                            <div class="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                                <span class="font-bold text-[15px] text-gray-900">我的订单</span>
                                <span class="text-[11px] text-gray-400">全部 <i class="fas fa-chevron-right text-[9px]"></i></span>
                            </div>
                            <div class="flex justify-around items-center pt-2">
                                <div class="flex flex-col items-center gap-2"><i class="fas fa-wallet text-[24px] text-gray-500"></i><span class="text-[12px] text-gray-700">待付款</span></div>
                                <div class="flex flex-col items-center gap-2"><i class="fas fa-box text-[24px] text-gray-500"></i><span class="text-[12px] text-gray-700">待发货</span></div>
                                <div class="flex flex-col items-center gap-2"><i class="fas fa-truck text-[24px] text-gray-500"></i><span class="text-[12px] text-gray-700">待收货</span></div>
                                <div class="flex flex-col items-center gap-2"><i class="far fa-comment-dots text-[24px] text-gray-500"></i><span class="text-[12px] text-gray-700">待评价</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ================= 图一：地址管理界面 ================= -->
            <transition name="page-slide">
                <div v-if="addressModal.showList" class="fixed inset-0 z-[100000] bg-[#f5f5f5] flex flex-col pb-safe font-sans">
                    <header class="h-[90px] pt-10 px-4 flex justify-between items-center bg-white shrink-0 sticky top-0 z-10">
                        <button @click="addressModal.showList = false" class="text-gray-800 text-xl w-8"><i class="fas fa-chevron-left"></i></button>
                        <span class="font-bold text-[18px]">我的收货地址</span>
                        <div class="flex gap-4 text-gray-800 text-xl w-14 justify-end">
                            <i class="fas fa-plus cursor-pointer" @click="addNewAddress"></i>
                            <i class="fas fa-bars cursor-pointer" @click="addressModal.isManageMode = !addressModal.isManageMode"></i>
                        </div>
                    </header>
                    <div class="flex-1 overflow-y-auto p-4 space-y-3">
                        <div v-if="addresses.length === 0" class="text-center text-gray-400 mt-20">暂无地址，请点击右上角添加</div>
                        <div v-for="addr in addresses" :key="addr.id" class="bg-white p-4 rounded-[16px] shadow-sm flex items-center justify-between" @click="checkoutModal.show ? selectAddressForCheckout(addr) : null">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center mt-1 shrink-0 text-white font-bold text-xs" :class="addr.owner === 'me' ? 'bg-orange-500' : 'bg-gray-400'">
                                    {{ addr.owner === 'me' ? '我' : 'TA' }}
                                </div>
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="font-bold text-[16px] text-gray-900">{{ addr.region }} {{ addr.detail }}</span>
                                    </div>
                                    <div class="text-[13px] text-gray-500 flex items-center gap-2">
                                        <span>{{ addr.name }} ({{ addr.gender }})</span>
                                        <span>{{ addr.phone }}</span>
                                        <span v-if="addr.tag" class="text-[10px] px-1.5 py-0.5 border border-[#ff5000] text-[#ff5000] rounded">{{ addr.tag }}</span>
                                    </div>
                                </div>
                            </div>
                            <i v-if="addressModal.isManageMode" class="fas fa-edit text-gray-400 text-lg p-2 cursor-pointer" @click.stop="editAddress(addr)"></i>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- ================= 图一：编辑/新增地址界面 (完美还原) ================= -->
            <transition name="app-slide">
                <div v-if="addressModal.showEdit" class="fixed inset-0 z-[100010] bg-[#f5f5f5] flex flex-col font-sans">
                    <!-- 模拟地图背景层 -->
                    <div class="absolute top-0 left-0 w-full h-[35%] overflow-hidden z-0 bg-[#e6eed8]">
                        <!-- 绘制地图网格与道路 -->
                        <div class="absolute w-[150%] h-[150%] -top-10 -left-10 opacity-30" style="background-image: linear-gradient(#fff 2px, transparent 2px), linear-gradient(90deg, #fff 2px, transparent 2px); background-size: 50px 50px;"></div>
                        <div class="absolute top-1/3 left-0 w-full h-8 bg-white/60 rotate-12"></div>
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <div class="bg-white px-3 py-2 rounded-[12px] shadow-lg text-[13px] font-bold flex flex-col items-center relative z-10 text-gray-800">
                                <span class="text-[10px] text-[#ff5000] mb-0.5 font-normal">骑手将配送至此</span>
                                {{ addressModal.editForm.detail || '可居酒店-大堂' }}
                                <div class="absolute -bottom-1.5 w-3 h-3 bg-white rotate-45"></div>
                            </div>
                            <div class="w-1 h-4 bg-black mt-1 rounded-full shadow-md"></div>
                        </div>
                        <div class="absolute right-4 bottom-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600"><i class="fas fa-crosshairs"></i></div>
                    </div>

                    <!-- 顶部透明导航 -->
                    <header class="h-[90px] pt-10 px-4 flex justify-between items-center shrink-0 z-10 relative">
                        <button @click="addressModal.showEdit = false" class="text-black text-xl w-10"><i class="fas fa-chevron-left"></i></button>
                        <span class="font-bold text-[18px] text-black drop-shadow-md">编辑地址</span>
                        <div class="bg-white rounded-full px-3 py-1.5 text-[13px] font-bold text-gray-800 flex items-center gap-1 shadow-sm cursor-pointer"><i class="fas fa-search text-gray-400"></i> 搜索</div>
                    </header>

                    <!-- 表单区域 (盖在地图上方) -->
                    <div class="flex-1 mt-[25%] bg-white rounded-t-3xl relative z-10 px-4 pt-6 pb-24 overflow-y-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        <div class="divide-y divide-gray-50">
                            <!-- 地址归属 -->
                            <div class="flex items-center py-5">
                                <span class="w-24 text-[16px] font-bold text-gray-800">地址归属</span>
                                <div class="flex gap-6">
                                    <label class="flex items-center gap-2 cursor-pointer" @click="addressModal.editForm.owner = 'me'">
                                        <i class="fas text-[18px]" :class="addressModal.editForm.owner === 'me' ? 'fa-dot-circle text-[#ff5000]' : 'fa-circle text-gray-300'"></i>
                                        <span class="text-[15px] text-gray-800">我的地址</span>
                                    </label>
                                    <label class="flex items-center gap-2 cursor-pointer" @click="addressModal.editForm.owner = 'other'">
                                        <i class="fas text-[18px]" :class="addressModal.editForm.owner === 'other' ? 'fa-dot-circle text-[#ff5000]' : 'fa-circle text-gray-300'"></i>
                                        <span class="text-[15px] text-gray-800">TA的地址</span>
                                    </label>
                                </div>
                            </div>

                            <div class="flex items-center py-5">
                                <span class="w-24 text-[16px] font-bold text-gray-800">地址</span>
                                <input v-model="addressModal.editForm.region" placeholder="省份 城市 区县" class="flex-1 outline-none text-[16px] font-bold text-gray-900 placeholder-gray-400">
                                <i class="fas fa-chevron-right text-gray-300"></i>
                            </div>
                            <div class="flex items-center py-5">
                                <span class="w-24 text-[16px] font-bold text-gray-800">门牌号</span>
                                <input v-model="addressModal.editForm.detail" placeholder="详细地址、小区门牌号" class="flex-1 outline-none text-[16px] font-bold text-gray-900 placeholder-gray-400">
                            </div>
                            <div class="flex items-center py-5">
                                <span class="w-24 text-[16px] font-bold text-gray-800">联系人</span>
                                <input v-model="addressModal.editForm.name" placeholder="名字" class="flex-1 outline-none text-[16px] font-bold text-gray-900 placeholder-gray-400 max-w-[100px]">
                                <div class="flex items-center gap-4 ml-auto">
                                    <label class="flex items-center gap-1.5 cursor-pointer" @click="addressModal.editForm.gender = '先生'">
                                        <i class="far text-[18px]" :class="addressModal.editForm.gender === '先生' ? 'fa-dot-circle text-[#ff5000]' : 'fa-circle text-gray-300'"></i>
                                        <span class="text-[14px] text-gray-700">先生</span>
                                    </label>
                                    <label class="flex items-center gap-1.5 cursor-pointer" @click="addressModal.editForm.gender = '女士'">
                                        <i class="far text-[18px]" :class="addressModal.editForm.gender === '女士' ? 'fa-dot-circle text-[#ff5000]' : 'fa-circle text-gray-300'"></i>
                                        <span class="text-[14px] text-gray-700">女士</span>
                                    </label>
                                </div>
                            </div>
                            <div class="flex items-center py-5">
                                <span class="w-24 text-[16px] font-bold text-gray-800">手机号</span>
                                <input v-model="addressModal.editForm.phone" placeholder="11位手机号" type="number" class="flex-1 outline-none text-[16px] font-bold text-gray-900 placeholder-gray-400">
                            </div>
                            <div class="flex items-center py-5">
                                <span class="w-24 text-[16px] font-bold text-gray-800 shrink-0">标签</span>
                                <div class="flex items-center flex-wrap gap-2.5 flex-1">
                                    <span v-for="t in ['家', '公司', '学校']" :key="t" 
                                          class="px-5 py-1.5 rounded-full text-[13px] border cursor-pointer transition"
                                          :class="addressModal.editForm.tag === t ? 'border-[#ff5000] text-[#ff5000] bg-orange-50' : 'border-gray-200 text-gray-600 bg-white'"
                                          @click="addressModal.editForm.tag = t; showCustomTagInput = false;">{{ t }}</span>
                                    
                                    <span class="px-4 py-1.5 rounded-full text-[13px] border cursor-pointer transition"
                                          :class="showCustomTagInput ? 'border-[#ff5000] text-[#ff5000] bg-orange-50' : 'border-gray-200 text-gray-600 bg-white'"
                                          @click="showCustomTagInput = true">自定义</span>
                                </div>
                            </div>
                            <div v-if="showCustomTagInput" class="py-3 bg-white flex items-center">
                                <span class="w-24"></span>
                                <input v-model="customTagValue" placeholder="输入自定义标签" class="flex-1 px-4 py-2 text-[14px] rounded-lg border border-gray-200 outline-none focus:border-[#ff5000]">
                            </div>
                        </div>

                        <!-- 智能识别区 -->
                        <div class="mt-6 bg-[#f9f9f9] rounded-2xl p-4 flex items-center justify-between text-gray-400 text-[14px] border border-gray-100">
                            <span>粘贴文本，智能识别地址信息</span>
                            <span class="bg-white border border-gray-200 px-5 py-1.5 rounded-full text-black font-bold shadow-sm">粘贴</span>
                        </div>
                    </div>

                    <!-- 底部固定按钮 -->
                    <div class="fixed bottom-0 left-0 w-full bg-white p-3 pb-safe flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20">
                        <button v-if="addressModal.editForm.id" @click="deleteAddress(addressModal.editForm.id); addressModal.showEdit=false;" class="w-[120px] bg-white border border-gray-200 text-gray-800 rounded-full font-bold text-[16px] py-3.5 shadow-sm">删除地址</button>
                        <button @click="saveAddress" class="flex-1 bg-[#ffcc00] text-black rounded-full font-bold text-[16px] py-3.5">保存地址</button>
                    </div>
                </div>
            </transition>

            <!-- ================= 图二：商品详情 (纯图标购物车、去掉备注、恢复代付) ================= -->
            <transition name="app-slide">
                <div v-if="taobaoModal.selectedItem" class="absolute inset-0 z-[50] bg-[#f2f2f6] flex flex-col pb-safe">
                    <header class="h-[90px] pt-10 px-4 flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100">
                        <button @click="taobaoModal.selectedItem = null" class="w-8 h-8 flex items-center justify-center bg-black/10 rounded-full text-gray-800"><i class="fas fa-chevron-left"></i></button>
                        <div class="flex gap-3">
                            <button class="w-8 h-8 flex items-center justify-center bg-black/10 rounded-full text-gray-800"><i class="fas fa-share"></i></button>
                            <button class="w-8 h-8 flex items-center justify-center bg-black/10 rounded-full text-gray-800"><i class="fas fa-ellipsis-h"></i></button>
                        </div>
                    </header>
                    <div class="flex-1 overflow-y-auto">
                        <div class="w-full aspect-square bg-gray-100 flex items-center justify-center relative" @click="showTaobaoDesc">
                            <i class="fas fa-box-open text-7xl text-orange-200"></i>
                            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/60 backdrop-blur px-3 py-1 rounded-full text-[11px] text-gray-600 flex items-center gap-1"><i class="fas fa-search-plus"></i> 点击查看全景描述</div>
                        </div>
                        <div class="bg-white p-4">
                            <div class="text-3xl font-bold font-mono text-[#ff5000] mb-2">¥{{ taobaoModal.selectedItem.price }}</div>
                            <h2 class="text-lg font-bold text-gray-900 leading-snug">{{ taobaoModal.selectedItem.name }}</h2>
                            <div class="flex justify-between items-center text-xs text-gray-400 mt-3">
                                <span>{{ taobaoModal.selectedItem.store }}</span>
                                <span>月销 {{ taobaoModal.selectedItem.sales }}</span>
                                <span>上海发货</span>
                            </div>
                        </div>
                        <div class="mt-3 bg-white p-4">
                            <span class="text-[13px] text-gray-500 font-bold mb-2 block">商品详情</span>
                            <p class="text-[14px] text-gray-800 leading-relaxed">{{ taobaoModal.selectedItem.desc }}</p>
                        </div>
                    </div>
                    
                    <!-- 图二底部操作栏 (去掉备注、保留代付、购物车变图标) -->
                    <div class="bg-white border-t border-gray-100 p-2 pb-safe flex gap-2 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-10 shrink-0">
                        <div class="flex flex-col items-center justify-center w-12 text-gray-500 cursor-pointer active:scale-90" @click="showToast('店铺')">
                            <i class="fas fa-store text-lg"></i>
                            <span class="text-[9px] mt-0.5">店铺</span>
                        </div>
                        <div class="flex flex-col items-center justify-center w-12 text-gray-500 cursor-pointer active:scale-90" @click="showToast('客服')">
                            <i class="fas fa-headset text-lg"></i>
                            <span class="text-[9px] mt-0.5">客服</span>
                        </div>
                        
                        <!-- 纯图标加入购物车 -->
                        <div class="w-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-800 text-xl cursor-pointer active:scale-95 mx-1" @click="addToCart">
                            <i class="fas fa-cart-plus"></i>
                        </div>
                        
                        <button @click="requestPayment" class="flex-1 bg-[#2c2c2e] text-white rounded-full font-bold text-[14px] active:scale-95 transition">发起代付</button>
                        <button @click="openCheckout('direct')" class="flex-1 bg-gradient-to-r from-[#ff9000] to-[#ff5000] text-white rounded-full font-bold text-[14px] shadow-md active:scale-95 transition">付款</button>
                    </div>
                </div>
            </transition>

            <!-- ================= 独立结算台 (提交订单页) ================= -->
            <transition name="app-slide">
                <div v-if="checkoutModal.show" class="absolute inset-0 z-[80] bg-[#f2f2f6] flex flex-col pb-safe">
                    <header class="h-[90px] pt-10 px-4 flex justify-between items-center bg-[#f2f2f6] sticky top-0 z-10">
                        <button @click="checkoutModal.show = false" class="text-gray-800 text-xl"><i class="fas fa-chevron-left"></i></button>
                        <span class="font-bold text-[17px]">确认订单</span>
                        <div class="w-8"></div>
                    </header>
                    <div class="flex-1 overflow-y-auto p-3 space-y-3">
                        <!-- 收货地址选择区块 -->
                        <div class="bg-white rounded-2xl p-4 shadow-sm relative overflow-hidden" @click="openAddressList">
                            <div class="absolute bottom-0 left-0 w-full h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0Ij48cGF0aCBkPSJNMCAwaDIwbTR2MEgyMCIgc3Ryb2tlPSIjZmY1MDAwIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1kYXNoYXJyYXk9IjIwIDIwIi8+PC9zdmc+')]"></div>
                            <div v-if="defaultAddress" class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0" :class="defaultAddress.owner === 'me' ? 'bg-blue-400' : 'bg-pink-400'">
                                        {{ defaultAddress.owner === 'me' ? '我' : 'TA' }}
                                    </div>
                                    <div>
                                        <div class="font-bold text-[16px]">{{ defaultAddress.region }} {{ defaultAddress.detail }}</div>
                                        <div class="text-[13px] text-gray-500">{{ defaultAddress.name }} {{ defaultAddress.phone }}</div>
                                    </div>
                                </div>
                                <i class="fas fa-chevron-right text-gray-300"></i>
                            </div>
                            <div v-else class="flex items-center justify-between py-2 text-[#ff5000] font-bold">
                                <span><i class="fas fa-plus-circle mr-1"></i> 请填写收货地址</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>

                        <!-- 商品清单 -->
                        <div class="bg-white rounded-2xl p-4 shadow-sm">
                            <div v-for="(item, idx) in checkoutModal.items" :key="idx" class="flex gap-3 mb-4 last:mb-0">
                                <div class="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-orange-200 shrink-0"><i class="fas fa-box"></i></div>
                                <div class="flex-1 flex flex-col justify-between py-1">
                                    <span class="text-[13px] font-medium text-gray-800 line-clamp-2">{{ item.name }}</span>
                                    <span class="text-[15px] font-bold text-gray-900 font-mono">¥{{ item.price }}</span>
                                </div>
                            </div>
                            
                            <!-- 备注移到这里 -->
                            <div class="mt-4 pt-4 border-t border-gray-50 flex items-center">
                                <span class="text-[14px] text-gray-800 w-16">订单备注</span>
                                <input v-model="checkoutModal.note" placeholder="选填，请先和商家协商一致" class="flex-1 text-[14px] outline-none">
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-3 pb-safe border-t border-gray-100 flex justify-between items-center z-10">
                        <div class="pl-2 text-gray-500">共 {{ checkoutModal.items.length }} 件，合计: <span class="text-xl font-bold text-[#ff5000] font-mono">¥{{ checkoutModal.totalPrice }}</span></div>
                        <button @click="submitCheckout" class="bg-gradient-to-r from-[#ff9000] to-[#ff5000] text-white px-8 py-3 rounded-full font-bold text-[15px] shadow-md active:scale-95 transition">提交订单</button>
                    </div>
                </div>
            </transition>

            <!-- 选择付款对象 (最终付款弹窗) -->
            <transition name="scale">
                <div v-if="taobaoPayTargetModal.show" class="fixed inset-0 z-[120000] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click="taobaoPayTargetModal.show = false">
                    <div class="bg-[#f2f2f6] w-[80%] rounded-[20px] overflow-hidden shadow-2xl flex flex-col" @click.stop>
                        <div class="p-4 border-b border-gray-200 text-center bg-[#f9f9f9]">
                            <span class="font-bold text-[15px] text-gray-900">{{ taobaoPayTargetModal.isRequestPay ? '发送代付请求' : '请选择付款方式' }}</span>
                        </div>
                        <div class="p-3 bg-white flex flex-col gap-2">
                            <button v-if="!taobaoPayTargetModal.isRequestPay" @click="confirmPayTaobao('self')" class="w-full py-3.5 bg-gray-50 rounded-xl text-[15px] font-bold text-gray-800 active:bg-gray-100 transition border border-gray-100">余额支付 (¥{{ checkoutModal.totalPrice }})</button>
                            <button v-if="wechatState.activeSession" @click="confirmPayTaobao('ai')" class="w-full py-3.5 bg-gray-50 rounded-xl text-[15px] font-bold text-gray-800 active:bg-gray-100 transition border border-gray-100">
                                {{ taobaoPayTargetModal.isRequestPay ? '发给 ' : '找人代付 (' }}{{ wechatState.activeSession?.isGroup ? '群聊' : wechatState.activeSession?.name }}{{ taobaoPayTargetModal.isRequestPay ? '' : ')' }}
                            </button>
                        </div>
                        <div class="p-3 border-t border-gray-200 bg-[#f9f9f9]">
                            <button @click="taobaoPayTargetModal.show = false" class="w-full bg-white border border-gray-200 text-gray-500 py-2.5 rounded-[12px] text-[15px] font-bold shadow-sm active:scale-95 transition">取消</button>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- 底部导航 (在搜索/商品详情/结算页隐藏) -->
            <div v-if="taobaoModal.activeTab !== 'search' && !taobaoModal.selectedItem && !checkoutModal.show && !addressModal.showList" class="h-[75px] pt-1.5 bg-white border-t border-gray-100 flex items-center justify-around shrink-0 pb-safe z-30">
                <div @click="taobaoModal.activeTab = 'home'" class="flex flex-col items-center gap-1 cursor-pointer transition w-12" :class="taobaoModal.activeTab === 'home' ? 'text-[#ff5000]' : 'text-gray-400'">
                    <i class="fas fa-home text-[22px]"></i><span class="text-[10px] font-bold">首页</span>
                </div>
                <div @click="taobaoModal.activeTab = 'takeout'" class="flex flex-col items-center gap-1 cursor-pointer transition w-12" :class="taobaoModal.activeTab === 'takeout' ? 'text-[#ff5000]' : 'text-gray-400'">
                    <i class="fas fa-motorcycle text-[22px]"></i><span class="text-[10px] font-bold">外卖</span>
                </div>
                <div @click="taobaoModal.activeTab = 'msg'" class="flex flex-col items-center gap-1 cursor-pointer transition w-12" :class="taobaoModal.activeTab === 'msg' ? 'text-[#ff5000]' : 'text-gray-400'">
                    <i class="fas fa-comment-dots text-[22px]"></i><span class="text-[10px] font-bold">消息</span>
                </div>
                <div @click="taobaoModal.activeTab = 'cart'" class="flex flex-col items-center gap-1 cursor-pointer transition w-12" :class="taobaoModal.activeTab === 'cart' ? 'text-[#ff5000]' : 'text-gray-400'">
                    <i class="fas fa-shopping-cart text-[22px]"></i><span class="text-[10px] font-bold">购物车</span>
                </div>
                <div @click="taobaoModal.activeTab = 'me'" class="flex flex-col items-center gap-1 cursor-pointer transition w-12" :class="taobaoModal.activeTab === 'me' ? 'text-[#ff5000]' : 'text-gray-400'">
                    <i class="fas fa-user text-[22px]"></i><span class="text-[10px] font-bold">我的</span>
                </div>
            </div>
        </div>
    `
};
