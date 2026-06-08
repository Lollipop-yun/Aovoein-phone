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
        groupedCart() {
            const groups = {};
            this.taobaoModal.cartItems.forEach(item => {
                if (!groups[item.store]) {
                    groups[item.store] = { storeName: item.store, items: [], selected: false };
                }
                groups[item.store].items.push(item);
            });
            Object.values(groups).forEach(g => {
                g.selected = g.items.length > 0 && g.items.every(i => i.selected);
            });
            return Object.values(groups);
        },
        selectedCartTotal() {
            return this.taobaoModal.cartItems
                .filter(i => i.selected)
                .reduce((sum, item) => sum + parseFloat(item.price), 0)
                .toFixed(2);
        },
        selectedCartCount() {
            return this.taobaoModal.cartItems.filter(i => i.selected).length;
        },
        isAllSelected() {
            return this.taobaoModal.cartItems.length > 0 && this.taobaoModal.cartItems.every(i => i.selected);
        },
        defaultAddress() {
            if (this.checkoutModal.selectedAddressId) {
                return this.addresses.find(a => a.id === this.checkoutModal.selectedAddressId) || this.addresses[0];
            }
            return this.addresses[0] || null;
        }
    },
    mounted() {
        this.refreshTaobaoItems();
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
        formatMoney(num) { 
            return parseFloat(num).toFixed(2); 
        },
        // 生成虚拟评价
        generateMockReviews(itemName, category) {
            const names = ['李**', '王**', '张**', '陈**', '刘**', '赵**', 'M**a', 'S**y'];
            const avatars = ['fa-user', 'fa-user-tie', 'fa-user-astronaut', 'fa-user-ninja', 'fa-ghost'];
            const templates = [
                `这个${itemName}真的太棒了，质量出乎意料的好，整体体验非常完美，下次还会继续回购的！`,
                `整体感觉非常不错，同类产品买过很多，这个算得上是性价比天花板了，强烈推荐给大家。`,
                `发货/配送速度很快，收到${itemName}的时候完好无损。实际体验下来很满意，跟描述的一模一样。`,
                `买给朋友的，朋友说非常喜欢。质感做工都很在线，绝对物超所值，是一次很愉快的购物体验！`,
                `非常惊艳！原本只是抱着试一试的心态，没想到实物比图片还要好，细节处理得很到位，满分好评。`
            ];
            const count = Math.floor(Math.random() * 3) + 1; // 1到3条评论
            const reviews = [];
            for(let i = 0; i < count; i++) {
                reviews.push({
                    user: names[Math.floor(Math.random() * names.length)],
                    avatarIcon: avatars[Math.floor(Math.random() * avatars.length)],
                    rating: Math.floor(Math.random() * 2) + 4, // 4或5星
                    content: templates[Math.floor(Math.random() * templates.length)],
                    date: '2023-10-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
                });
            }
            return reviews;
        },
        refreshTaobaoItems() {
            // 商城数据
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
                    item.appearance = `一件包装精美的${item.name}，使用印有品牌Logo的盒子仔细封装着。`; 
                    item.selected = true;
                    item.reviews = this.generateMockReviews(item.name, store.category);
                    allItems.push({...item, storeName: store.name, category: store.category});
                });
            });
            allItems.sort(() => Math.random() - 0.5);
            this.taobaoModal.hotSales = allItems;

            // 外卖数据 (至少3个推荐店铺)
            this.taobaoModal.takeoutStoreList = [
                { id: 1, category: '美食', name: 'Wagas 沃歌斯', tag: '健康轻食', items:[{name: '牛肉能量碗', price: '52.00'}, {name: '煎烤鸡肉沙拉', price: '45.00'}, {name: '意式肉酱面', price: '38.00'}] },
                { id: 2, category: '美食', name: 'KFC 肯德基', tag: '西式快餐', items:[{name: '麦辣鸡腿堡套餐', price: '38.00'}, {name: '原味鸡+薯条', price: '25.00'}, {name: '老北京卷', price: '18.00'}] },
                { id: 3, category: '美食', name: '老乡鸡', tag: '中式快餐', items:[{name: '肥西老母鸡汤', price: '18.00'}, {name: '梅菜扣肉', price: '22.00'}, {name: '葱油鸡', price: '20.00'}] },
                { id: 4, category: '美食', name: '麦当劳', tag: '汉堡薯条', items:[{name: '巨无霸套餐', price: '35.00'}, {name: '麦旋风', price: '13.00'}, {name: '麦乐鸡', price: '14.00'}] },
                { id: 5, category: '饮品', name: '霸王茶姬', tag: '新中式奶茶', items:[{name: '伯牙绝弦', price: '20.00'}, {name: '春日桃桃', price: '18.00'}] },
                { id: 6, category: '日用品', name: '屈臣氏', tag: '便利超市', items:[{name: '洗脸巾', price: '15.00'}, {name: '洁面乳', price: '45.00'}] }
            ];
            let allTakeoutItems = [];
            this.taobaoModal.takeoutStoreList.forEach(store => {
                store.items.forEach(item => {
                    item.cartId = Date.now() + Math.random();
                    item.sales = Math.floor(Math.random() * 2000 + 2000);
                    item.desc = '严选新鲜食材，口感层次极其丰富！';
                    item.appearance = `一份刚出炉的${item.name}，被仔细装在环保外卖盒中。`; 
                    item.selected = true;
                    item.reviews = this.generateMockReviews(item.name, store.category);
                    allTakeoutItems.push({...item, storeName: store.name, category: store.category});
                });
            });
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
                reviews: item.reviews || this.generateMockReviews(item.name, '商品'),
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
                        sales: Math.floor(Math.random() * 9000 + 100), desc: `关于${kw}的巅峰之作！`, appearance: `一件全新的${kw}`,
                        reviews: this.generateMockReviews(kw, '商品')
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

        // --- 收货地址管理逻辑 (图二结构) ---
        getEmptyAddress() {
            return { id: null, owner: 'me', region: '', detail: '', name: '', phone: '', tag: '家' };
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
            this.showCustomTagInput = !['家', '公司', '学校', '父母', '朋友'].includes(addr.tag);
            if (this.showCustomTagInput) this.customTagValue = addr.tag;
        },
        deleteAddress(id) {
            this.addresses = this.addresses.filter(a => a.id !== id);
            this.saveAddressesToLocal();
            this.showToast('地址已删除');
        },
        saveAddress() {
            const form = this.addressModal.editForm;
            if (!form.region || !form.detail || !form.name || !form.phone) return this.showToast('请将带有 * 的必填信息填写完整');
            if (this.showCustomTagInput && this.customTagValue) form.tag = this.customTagValue;

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
            if (!this.checkoutModal.selectedAddressId && this.addresses.length > 0) {
                this.checkoutModal.selectedAddressId = this.addresses[0].id;
            }
            
            this.checkoutModal.show = true;
        },

        requestPayment() {
            if (!this.taobaoModal.selectedItem) return;
            this.taobaoPayTargetModal.isRequestPay = true;
            this.checkoutModal.items = [this.taobaoModal.selectedItem];
            this.checkoutModal.totalPrice = this.taobaoModal.selectedItem.price;
            this.taobaoPayTargetModal.show = true;
        },

        submitCheckout() {
            if (!this.defaultAddress) return this.showToast('请先选择或添加收货地址');
            this.taobaoPayTargetModal.isRequestPay = false;
            this.taobaoPayTargetModal.show = true;
        },

        confirmPayTaobao(target) {
            const totalAmt = parseFloat(this.checkoutModal.totalPrice);
            const isRequest = this.taobaoPayTargetModal.isRequestPay;

            if (isRequest) {
                const item = this.checkoutModal.items[0];
                if (this.wechatState.activeSession) {
                    this.wechatState.activeSession.messages.push({
                        type: 'food_payment',
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

            if (target === 'self') {
                if (this.wallet.balance < totalAmt) return this.showToast('余额不足，请先充值');
                this.$emit('add-to-wallet', 'expense', totalAmt, '网络购物', `订单合并付款`);
            }
            
            if (this.wechatState.activeSession) {
                const session = this.wechatState.activeSession;
                const itemNames = this.checkoutModal.items.map(i => i.name).join('、');
                const displayName = itemNames.length > 15 ? itemNames.substring(0, 15) + '...' : itemNames;

                if (target === 'self') {
                    session.messages.push({
                        type: 'text',
                        content: `我刚刚买好了：${displayName}。`,
                        isSelf: true,
                        time: Date.now(),
                        avatar: this.getMaskById(session.maskId).avatar
                    });
                } else {
                    session.messages.push({
                        type: 'food_delivery',
                        item: `[购物订单] ${displayName}`,
                        amount: totalAmt.toFixed(2),
                        remark: this.checkoutModal.note || '无备注',
                        eta: '预计3天送达',
                        isSelf: true,
                        time: Date.now(),
                        avatar: this.getMaskById(session.maskId).avatar
                    });
                }
                session.lastMessage = '[购物订单]';
                this.$emit('scroll-to-bottom');
            }
            
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
        <div class="absolute inset-0 z-[1000] bg-[#f9f9f9] flex flex-col font-sans pb-safe">
            <!-- 顶部导航 -->
            <header class="h-[90px] pt-10 px-4 flex items-center justify-between bg-white text-gray-900 border-b border-gray-100 shrink-0 z-50 sticky top-0 shadow-sm">
                <button @click="taobaoModal.activeTab === 'search' ? (taobaoModal.activeTab = 'home') : closeApp()" class="w-8 h-8 flex items-center justify-center active:opacity-50"><i class="fas fa-chevron-left text-lg"></i></button>
                <h1 class="font-bold text-[17px] absolute left-1/2 -translate-x-1/2 tracking-wide">{{ taobaoModal.activeTab === 'search' ? '搜索' : (taobaoModal.activeTab === 'home' ? '商城' : (taobaoModal.activeTab === 'takeout' ? '外卖' : (taobaoModal.activeTab === 'msg' ? '消息' : (taobaoModal.activeTab === 'cart' ? '购物车' : '我的')))) }}</h1>
                <button v-if="taobaoModal.activeTab === 'home' || taobaoModal.activeTab === 'takeout'" @click="refreshTaobaoItems" class="w-8 h-8 flex items-center justify-center active:opacity-50"><i class="fas fa-sync-alt text-gray-600"></i></button>
                <div v-else class="w-8"></div>
            </header>

            <div class="flex-1 overflow-y-auto pb-6 relative">
                <!-- ================= 首页 (商城) ================= -->
                <div v-if="taobaoModal.activeTab === 'home'" class="flex flex-col min-h-full bg-[#f5f5f5]">
                    <div class="pt-4 px-4 pb-2 bg-white rounded-b-[20px] shadow-sm z-10">
                        <div class="bg-[#f5f5f5] rounded-full flex items-center px-4 h-10 cursor-text" @click="taobaoModal.activeTab = 'search'; taobaoModal.searchResults=[]; taobaoModal.searchKeyword='';">
                            <i class="fas fa-search text-gray-400 mr-2"></i>
                            <div class="text-gray-400 text-[14px]">寻找宝贝、店铺...</div>
                        </div>
                    </div>
                    <!-- 分类 -->
                    <div class="px-4 py-3 z-10 sticky top-0 bg-[#f5f5f5]">
                        <div class="bg-white rounded-full p-1 flex items-center justify-between shadow-sm border border-gray-100">
                            <div v-for="cat in ['服饰', '数码', '美妆', '零食', '日用']" :key="cat"
                                 class="flex-1 text-center py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer"
                                 :class="taobaoModal.activeCategory === cat ? 'bg-[#2c2c2e] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'"
                                 @click="taobaoModal.activeCategory = cat">
                                {{ cat }}
                            </div>
                        </div>
                    </div>
                    <!-- 本周热销 -->
                    <div v-if="taobaoModal.hotSales && taobaoModal.hotSales.length > 0" class="px-4 mb-2 mt-2">
                        <div class="text-[16px] font-bold text-gray-900 tracking-wide flex items-center gap-1.5 mb-3 ml-1">本周热销 <i class="fas fa-fire text-red-500 text-sm"></i></div>
                        <div class="flex overflow-x-auto gap-3 scrollbar-hide">
                            <div v-for="(item, idx) in taobaoModal.hotSales.filter(s => s.category === taobaoModal.activeCategory).slice(0, 5)" :key="'hot'+idx" @click="openTaobaoItem(item, item.storeName)" class="w-[130px] shrink-0 bg-white rounded-[16px] p-2.5 shadow-sm cursor-pointer active:scale-95 transition">
                                <div class="w-full h-24 bg-[#f9f9f9] rounded-xl mb-3 flex items-center justify-center text-gray-200 relative overflow-hidden border border-gray-50">
                                    <i class="fas fa-shopping-bag text-4xl opacity-40"></i>
                                    <div class="absolute top-0 left-0 bg-[#ff4d4f] text-white text-[10px] font-bold px-2 py-0.5 rounded-br-xl rounded-tl-xl">TOP {{ idx + 1 }}</div>
                                </div>
                                <div class="text-[14px] font-bold text-gray-900 truncate w-full mb-1">{{ item.name }}</div>
                                <div class="flex justify-between items-center mt-1">
                                    <span class="text-[15px] font-bold text-gray-900 font-mono">¥{{ item.price }}</span>
                                    <span class="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">售{{ item.sales }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 精选店铺 -->
                    <div class="px-4 space-y-4 pb-4 pt-3">
                        <div class="text-[16px] font-bold text-gray-900 tracking-wide flex items-center gap-1.5 ml-1 mb-1">精选店铺</div>
                        <div v-for="store in (taobaoModal.storeList ||[]).filter(s => s.category === taobaoModal.activeCategory)" :key="store.id" class="bg-white rounded-[16px] p-4 shadow-sm border border-gray-50 flex flex-col gap-3">
                            <div class="flex items-center gap-3 border-b border-gray-50 pb-3">
                                <div class="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100"><i class="fas fa-store text-xl"></i></div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-[16px] text-gray-900">{{ store.name }}</span>
                                    <span class="text-[11px] text-gray-500 mt-0.5">{{ store.tag }} · 官方认证</span>
                                </div>
                            </div>
                            <div class="flex overflow-x-auto gap-3 scrollbar-hide">
                                <div v-for="(item, idx) in store.items" :key="idx" @click="openTaobaoItem(item, store.name)" class="w-[105px] shrink-0 flex flex-col gap-1 cursor-pointer active:scale-95 transition">
                                    <div class="w-full h-[105px] bg-[#f9f9f9] rounded-xl overflow-hidden flex items-center justify-center text-gray-300 border border-gray-100"><i class="fas fa-box-open text-3xl"></i></div>
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

                <!-- ================= 外卖 ================= -->
                <div v-if="taobaoModal.activeTab === 'takeout'" class="flex flex-col bg-[#f5f5f5] min-h-full">
                    <div class="pt-4 px-4 pb-2 bg-white rounded-b-[20px] shadow-sm z-10">
                        <div class="bg-[#f5f5f5] rounded-full flex items-center px-4 h-10 cursor-text" @click="taobaoModal.activeTab = 'search'; taobaoModal.searchResults=[]; taobaoModal.searchKeyword='';">
                            <i class="fas fa-search text-gray-400 mr-2 text-[14px]"></i>
                            <div class="text-gray-400 text-[14px]">搜外卖、搜商家...</div>
                        </div>
                    </div>
                    <div class="px-4 py-3 z-10 sticky top-0 bg-[#f5f5f5]">
                        <div class="bg-white rounded-full p-1 flex items-center justify-between shadow-sm border border-gray-100">
                            <div v-for="cat in ['美食', '蔬果', '饮品', '日用品', '其他']" :key="cat"
                                 class="flex-1 text-center py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer"
                                 :class="taobaoModal.takeoutCategory === cat ? 'bg-[#2c2c2e] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'"
                                 @click="taobaoModal.takeoutCategory = cat">
                                {{ cat }}
                            </div>
                        </div>
                    </div>
                    <div v-if="taobaoModal.takeoutHotSales && taobaoModal.takeoutHotSales.length > 0" class="px-4 mb-2 mt-2">
                        <div class="text-[16px] font-bold text-gray-900 tracking-wide flex items-center gap-1.5 mb-3 ml-1">本周热销 <i class="fas fa-fire text-red-500 text-sm"></i></div>
                        <div class="flex overflow-x-auto gap-3 scrollbar-hide">
                            <div v-for="(item, idx) in taobaoModal.takeoutHotSales.filter(s => s.category === taobaoModal.takeoutCategory).slice(0, 5)" :key="'hot'+idx" @click="openTaobaoItem(item, item.storeName)" class="w-[130px] shrink-0 bg-white rounded-[16px] p-2.5 shadow-sm cursor-pointer active:scale-95 transition">
                                <div class="w-full h-24 bg-[#f9f9f9] rounded-xl mb-3 flex items-center justify-center text-gray-200 relative overflow-hidden border border-gray-50">
                                    <i class="fas fa-utensils text-4xl opacity-40"></i>
                                    <div class="absolute top-0 left-0 bg-[#ff4d4f] text-white text-[10px] font-bold px-2 py-0.5 rounded-br-xl rounded-tl-xl">TOP {{ idx + 1 }}</div>
                                </div>
                                <div class="text-[14px] font-bold text-gray-900 truncate w-full mb-1">{{ item.name }}</div>
                                <div class="flex justify-between items-center mt-1">
                                    <span class="text-[15px] font-bold text-gray-900 font-mono">¥{{ item.price }}</span>
                                    <span class="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">售{{ item.sales }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="px-4 space-y-4 pb-4 pt-3">
                        <div class="text-[16px] font-bold text-gray-900 tracking-wide flex items-center gap-1.5 ml-1 mb-1">附近推荐</div>
                        <div v-for="store in (taobaoModal.takeoutStoreList ||[]).filter(s => s.category === taobaoModal.takeoutCategory)" :key="store.id" class="bg-white rounded-[16px] p-4 shadow-sm border border-gray-50 flex flex-col gap-3">
                            <div class="flex items-center gap-3 border-b border-gray-50 pb-3">
                                <div class="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100"><i class="fas fa-store text-xl"></i></div>
                                <div class="flex flex-col">
                                    <span class="font-bold text-[16px] text-gray-900">{{ store.name }}</span>
                                    <span class="text-[11px] text-gray-500 mt-0.5">{{ store.tag }} · 30分钟送达</span>
                                </div>
                            </div>
                            <div class="flex overflow-x-auto gap-3 scrollbar-hide">
                                <div v-for="(item, idx) in store.items" :key="idx" @click="openTaobaoItem(item, store.name)" class="w-[105px] shrink-0 flex flex-col gap-1 cursor-pointer active:scale-95 transition">
                                    <div class="w-full h-[105px] bg-[#f9f9f9] rounded-xl overflow-hidden flex items-center justify-center text-gray-300 border border-gray-100"><i class="fas fa-utensils text-3xl"></i></div>
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
                    <div class="px-4 py-3 z-10 sticky top-0 bg-[#f5f5f5] flex justify-center border-b border-gray-100">
                        <div class="bg-gray-200/80 p-1 rounded-[10px] flex items-center w-[60%] shadow-inner">
                            <div class="flex-1 text-center py-1.5 rounded-md text-[14px] font-bold transition-all cursor-pointer"
                                 :class="taobaoModal.msgTab === 'merchant' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
                                 @click="taobaoModal.msgTab = 'merchant'">商家</div>
                            <div class="flex-1 text-center py-1.5 rounded-md text-[14px] font-bold transition-all cursor-pointer"
                                 :class="taobaoModal.msgTab === 'rider' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'"
                                 @click="taobaoModal.msgTab = 'rider'">骑手</div>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto px-4 pt-10">
                        <div v-if="taobaoModal.msgTab === 'merchant'" class="flex flex-col items-center justify-center text-gray-400 mt-20">
                            <i class="fas fa-store text-5xl mb-4 opacity-20"></i>
                            <span class="text-sm font-medium tracking-wide">暂无商家消息</span>
                        </div>
                        <div v-else class="flex flex-col items-center justify-center text-gray-400 mt-20">
                            <i class="fas fa-motorcycle text-5xl mb-4 opacity-20"></i>
                            <span class="text-sm font-medium tracking-wide">暂无骑手消息</span>
                        </div>
                    </div>
                </div>

                <!-- 搜索页 -->
                <div v-if="taobaoModal.activeTab === 'search'" class="flex flex-col bg-[#f5f5f5] min-h-full">
                    <div class="pt-4 px-4 pb-2 bg-white flex items-center gap-2 z-10 sticky top-0 shadow-sm border-b border-gray-100">
                        <div class="bg-[#f5f5f5] rounded-[10px] flex items-center px-3 h-9 shadow-inner border border-gray-100 flex-1">
                            <i class="fas fa-search text-gray-400 mr-2 text-[14px]"></i>
                            <input v-model="taobaoModal.searchKeyword" @keyup.enter="doTaobaoSearch" placeholder="搜索宝贝..." class="bg-transparent flex-1 outline-none text-[14px] text-gray-800" autofocus>
                            <i v-if="taobaoModal.searchKeyword" @click="taobaoModal.searchKeyword=''; taobaoModal.activeTab='home'" class="fas fa-times-circle text-gray-300 ml-2 cursor-pointer"></i>
                        </div>
                        <button @click="doTaobaoSearch" class="text-sm font-bold text-gray-800 px-2 active:opacity-50">搜索</button>
                    </div>
                    <div class="flex-1 overflow-y-auto px-4 pb-10">
                        <div v-if="taobaoModal.isSearching" class="flex flex-col items-center justify-center mt-32 text-gray-400">
                            <i class="fas fa-spinner fa-spin text-3xl mb-4 text-gray-400"></i>
                            <span class="text-sm font-bold tracking-widest">寻找中...</span>
                        </div>
                        <div v-else-if="taobaoModal.searchResults.length > 0" class="space-y-3 mt-4">
                            <div class="text-[13px] font-bold text-gray-500 mb-2">搜索结果</div>
                            <div v-for="(item, idx) in taobaoModal.searchResults" :key="'sr'+idx" @click="openTaobaoItem(item, item.store)" class="bg-white rounded-[16px] p-3 shadow-sm border border-gray-50 flex gap-3 cursor-pointer active:bg-gray-50">
                                <div class="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 shrink-0 border border-gray-100"><i class="fas fa-shopping-bag text-2xl"></i></div>
                                <div class="flex flex-col flex-1 min-w-0 py-0.5">
                                    <span class="font-bold text-[15px] text-gray-900 truncate">{{ item.name }}</span>
                                    <span class="text-[11px] text-gray-500 mt-1 truncate"><i class="fas fa-store mr-1 text-gray-300"></i>{{ item.store }}</span>
                                    <div class="mt-auto flex justify-between items-center">
                                        <span class="text-[16px] font-bold text-gray-900 font-mono">¥{{ item.price }}</span>
                                        <span class="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">售{{ item.sales }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center text-gray-400 text-sm mt-32">
                            <i class="fas fa-search text-4xl mb-4 opacity-20 block"></i>输入你想寻找的商品
                        </div>
                    </div>
                </div>

                <!-- 购物车 -->
                <div v-if="taobaoModal.activeTab === 'cart'" class="flex-1 flex flex-col min-h-full bg-[#f5f5f5]">
                    <div class="px-4 py-3 flex justify-between items-center bg-white shrink-0 border-b border-gray-100 shadow-sm z-10">
                        <span class="font-bold text-[18px] text-gray-900">购物车 ({{ taobaoModal.cartItems.length }})</span>
                        <span @click="taobaoModal.cartItems = []" class="text-[14px] text-gray-500 font-bold active:opacity-50 cursor-pointer">管理</span>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4">
                        <div v-if="taobaoModal.cartItems.length === 0" class="text-center text-gray-400 mt-32">
                            <i class="fas fa-shopping-cart text-5xl mb-4 opacity-20"></i>
                            <p class="font-medium text-sm">购物车还是空的，快去逛逛吧</p>
                        </div>
                        <div v-for="(group, gIdx) in groupedCart" :key="gIdx" class="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-50">
                            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
                                <div @click="toggleStoreSelect(group)" class="w-5 h-5 rounded-full border flex items-center justify-center transition cursor-pointer" :class="group.selected ? 'bg-[#2c2c2e] border-[#2c2c2e]' : 'border-gray-300'">
                                    <i v-if="group.selected" class="fas fa-check text-white text-[10px]"></i>
                                </div>
                                <i class="fas fa-store text-gray-400 text-sm"></i>
                                <span class="font-bold text-[15px] text-gray-900">{{ group.storeName }}</span>
                                <i class="fas fa-chevron-right text-gray-300 text-xs"></i>
                            </div>
                            <div v-for="(item, iIdx) in group.items" :key="item.cartId" class="flex items-center gap-3 mb-5 last:mb-0 relative">
                                <div @click="item.selected = !item.selected" class="w-5 h-5 rounded-full border flex items-center justify-center transition shrink-0 cursor-pointer" :class="item.selected ? 'bg-[#2c2c2e] border-[#2c2c2e]' : 'border-gray-300'">
                                    <i v-if="item.selected" class="fas fa-check text-white text-[10px]"></i>
                                </div>
                                <div class="w-24 h-24 bg-[#f9f9f9] rounded-xl flex items-center justify-center text-gray-300 shrink-0 border border-gray-100"><i class="fas fa-image text-3xl opacity-50"></i></div>
                                <div class="flex flex-col flex-1 min-w-0 h-24 py-1">
                                    <span class="text-[14px] text-gray-900 font-medium line-clamp-2 leading-snug">{{ item.name }}</span>
                                    <div class="mt-auto flex justify-between items-end w-full">
                                        <span class="text-[18px] font-bold text-gray-900 font-mono leading-none">¥{{ item.price }}</span>
                                        <i class="far fa-trash-alt text-gray-400 cursor-pointer p-2 -mr-2 active:text-red-500 transition" @click="removeFromCart(item)"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="taobaoModal.cartItems.length > 0" class="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2 pl-4 pr-3 flex justify-between items-center z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        <div class="flex items-center gap-2 cursor-pointer" @click="toggleAllSelect">
                            <div class="w-5 h-5 rounded-full border flex items-center justify-center transition" :class="isAllSelected ? 'bg-[#2c2c2e] border-[#2c2c2e]' : 'border-gray-300'">
                                <i v-if="isAllSelected" class="fas fa-check text-white text-[10px]"></i>
                            </div>
                            <span class="text-[14px] font-bold text-gray-600">全选</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="flex flex-col items-end">
                                <div class="text-[12px] text-gray-500">合计: <span class="text-[20px] font-bold text-gray-900 font-mono ml-1">¥{{ selectedCartTotal }}</span></div>
                            </div>
                            <button @click="openCheckout('cart')" class="bg-[#2c2c2e] text-white px-8 py-3 rounded-full font-bold text-[15px] shadow-md active:scale-95 transition">结算({{ selectedCartCount }})</button>
                        </div>
                    </div>
                </div>

                <!-- ================= 图一：我的 (卡片式极简白灰风) ================= -->
                <div v-if="taobaoModal.activeTab === 'me'" class="flex flex-col min-h-full pb-10 bg-[#f5f5f5]">
                    <!-- 顶部名片卡片 -->
                    <div class="pt-6 px-4 pb-2 z-10">
                        <div class="bg-white rounded-[24px] p-6 shadow-sm border border-gray-50 flex items-center gap-5">
                            <div class="w-[70px] h-[70px] rounded-full overflow-hidden bg-gray-100 border border-gray-200 shadow-inner shrink-0">
                                <img :src="homeProfile.avatar" class="w-full h-full object-cover">
                            </div>
                            <div class="flex flex-col justify-center">
                                <span class="font-bold text-[22px] text-gray-900 tracking-wide">{{ homeProfile.name }}</span>
                                <span class="text-[13px] text-gray-500 mt-1.5 font-mono">总资产: ¥ {{ wallet.balance }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="px-4 space-y-4 z-10 mt-2">
                        <!-- 我的订单卡片 -->
                        <div class="bg-white rounded-[24px] p-5 shadow-sm border border-gray-50">
                            <div class="font-bold text-[16px] text-gray-900 mb-5">我的订单</div>
                            <div class="flex justify-between items-center px-2">
                                <div class="flex flex-col items-center gap-2 cursor-pointer active:opacity-50"><i class="fas fa-file-invoice text-[24px] text-gray-700"></i><span class="text-[13px] text-gray-600 font-medium">全部订单</span></div>
                                <div class="flex flex-col items-center gap-2 cursor-pointer active:opacity-50"><i class="fas fa-truck text-[24px] text-gray-700"></i><span class="text-[13px] text-gray-600 font-medium">待收货</span></div>
                                <div class="flex flex-col items-center gap-2 cursor-pointer active:opacity-50"><i class="far fa-comment-dots text-[24px] text-gray-700"></i><span class="text-[13px] text-gray-600 font-medium">评价</span></div>
                                <div class="flex flex-col items-center gap-2 cursor-pointer active:opacity-50"><i class="fas fa-headset text-[24px] text-gray-700"></i><span class="text-[13px] text-gray-600 font-medium">售后</span></div>
                            </div>
                        </div>

                        <!-- 列表卡片 -->
                        <div class="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-50 divide-y divide-gray-50">
                            <div class="p-5 flex items-center justify-between cursor-pointer active:bg-gray-50 transition" @click="openAddressList">
                                <span class="font-medium text-[16px] text-gray-800">收货地址</span>
                                <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
                            </div>
                            <div class="p-5 flex items-center justify-between cursor-pointer active:bg-gray-50 transition" @click="showToast('高级设置')">
                                <span class="font-medium text-[16px] text-gray-800">高级设置</span>
                                <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
                            </div>
                            <div class="p-5 flex items-center justify-between cursor-pointer active:bg-gray-50 transition" @click="showToast('好友动态')">
                                <span class="font-medium text-[16px] text-gray-800">好友动态</span>
                                <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ================= 图二：地址管理列表 ================= -->
            <transition name="page-slide">
                <div v-if="addressModal.showList" class="fixed inset-0 z-[100000] bg-[#f5f5f5] flex flex-col pb-safe font-sans">
                    <header class="h-[90px] pt-10 px-4 flex justify-between items-center bg-white shrink-0 sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                        <button @click="addressModal.showList = false" class="text-gray-900 text-xl w-10"><i class="fas fa-chevron-left"></i></button>
                        <span class="font-bold text-[18px] text-gray-900">我的收货地址</span>
                        <div class="flex gap-5 text-gray-900 text-xl w-14 justify-end">
                            <i class="fas fa-plus cursor-pointer active:opacity-50" @click="addNewAddress"></i>
                            <i class="fas fa-bars cursor-pointer active:opacity-50" @click="addressModal.isManageMode = !addressModal.isManageMode"></i>
                        </div>
                    </header>
                    <div class="flex-1 overflow-y-auto p-4 space-y-4">
                        <div v-if="addresses.length === 0" class="text-center text-gray-400 mt-32 text-[14px]">暂无收货地址，请点击右上角添加</div>
                        <div v-for="addr in addresses" :key="addr.id" class="bg-white p-5 rounded-[20px] shadow-sm flex items-center justify-between border border-gray-50" @click="checkoutModal.show ? selectAddressForCheckout(addr) : null">
                            <div class="flex items-start gap-4">
                                <!-- 归属人图标 -->
                                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[14px] shadow-sm" :class="addr.owner === 'me' ? 'bg-[#2c2c2e]' : 'bg-gray-400'">
                                    {{ addr.owner === 'me' ? '我' : 'TA' }}
                                </div>
                                <div>
                                    <div class="flex items-center gap-2 mb-1.5">
                                        <span class="font-bold text-[16px] text-gray-900 leading-snug">{{ addr.region }} {{ addr.detail }}</span>
                                    </div>
                                    <div class="text-[14px] text-gray-500 flex items-center gap-3">
                                        <span>{{ addr.name }}</span>
                                        <span class="font-mono">{{ addr.phone }}</span>
                                        <span v-if="addr.tag" class="text-[10px] px-2 py-0.5 border border-gray-300 text-gray-500 rounded font-bold">{{ addr.tag }}</span>
                                    </div>
                                </div>
                            </div>
                            <i v-if="addressModal.isManageMode" class="far fa-edit text-gray-400 text-xl p-2 cursor-pointer active:text-blue-500 transition" @click.stop="editAddress(addr)"></i>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- ================= 图二：编辑地址 (带双栏 Tab + 地图 + 橙黄风格) ================= -->
            <transition name="app-slide">
                <div v-if="addressModal.showEdit" class="fixed inset-0 z-[100010] bg-[#f5f5f5] flex flex-col font-sans">
                    
                    <header class="h-[90px] pt-10 px-4 flex justify-between items-center bg-transparent shrink-0 z-20 relative">
                        <button @click="addressModal.showEdit = false" class="text-gray-900 text-xl w-10 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur shadow-sm"><i class="fas fa-chevron-left text-[16px]"></i></button>
                        <span class="font-bold text-[18px] text-gray-900 drop-shadow-md">编辑地址</span>
                        <div class="bg-white/90 backdrop-blur rounded-full px-3 py-1.5 text-[14px] font-bold text-gray-800 flex items-center gap-1.5 shadow-sm cursor-pointer"><i class="fas fa-search text-gray-400"></i> 搜索</div>
                    </header>

                    <div class="flex-1 mt-[2%] bg-white rounded-t-3xl relative z-10 px-5 pt-6 pb-28 overflow-y-auto shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        
                        <!-- 顶部分栏 Tab -->
                        <div class="flex bg-[#f5f5f5] rounded-xl p-1 mb-6">
                            <div class="flex-1 text-center py-2.5 rounded-lg text-[15px] font-bold cursor-pointer transition-all"
                                 :class="addressModal.editForm.owner === 'me' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'"
                                 @click="addressModal.editForm.owner = 'me'">我的地址</div>
                            <div class="flex-1 text-center py-2.5 rounded-lg text-[15px] font-bold cursor-pointer transition-all"
                                 :class="addressModal.editForm.owner === 'other' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'"
                                 @click="addressModal.editForm.owner = 'other'">角色地址</div>
                        </div>

                        <!-- 纯地图框 (无文字) -->
                        <div class="w-full h-[140px] bg-[#eef5e1] rounded-2xl mb-6 relative overflow-hidden border border-gray-100 shadow-inner">
                            <div class="absolute w-[150%] h-[150%] -top-10 -left-10 opacity-40" style="background-image: linear-gradient(#fff 2px, transparent 2px), linear-gradient(90deg, #fff 2px, transparent 2px); background-size: 40px 40px;"></div>
                            <div class="absolute top-1/2 left-0 w-full h-8 bg-white/50 rotate-12"></div>
                            <!-- 纯图钉 -->
                            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center drop-shadow-md">
                                <div class="w-5 h-5 bg-gray-600 rounded-full border-[3px] border-white flex items-center justify-center z-10">
                                    <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                                <div class="w-1 h-5 bg-gray-600 rounded-full -mt-1"></div>
                            </div>
                        </div>

                        <!-- 表单内容 -->
                        <div class="divide-y divide-gray-100">
                            <div class="flex items-center py-5">
                                <span class="w-24 text-[16px] text-gray-900"><span class="text-red-500 mr-1">*</span>所在地区</span>
                                <input v-model="addressModal.editForm.region" placeholder="如：广东省 广州市 天河区" class="flex-1 outline-none text-[16px] text-gray-900 placeholder-gray-300">
                                <i class="fas fa-chevron-right text-gray-300"></i>
                            </div>
                            <div class="flex items-center py-5">
                                <span class="w-24 text-[16px] text-gray-900"><span class="text-red-500 mr-1">*</span>详细地址</span>
                                <input v-model="addressModal.editForm.detail" placeholder="如：某某小区X栋X号" class="flex-1 outline-none text-[16px] text-gray-900 placeholder-gray-300">
                            </div>
                            <div class="flex items-center py-5">
                                <span class="w-24 text-[16px] text-gray-900"><span class="text-red-500 mr-1">*</span>收货人</span>
                                <input v-model="addressModal.editForm.name" placeholder="名字" class="flex-1 outline-none text-[16px] text-gray-900 placeholder-gray-300">
                            </div>
                            <div class="flex items-center py-5">
                                <span class="w-[45px] text-[16px] text-gray-900">+86</span>
                                <span class="w-[51px] text-[16px] text-gray-900"><span class="text-red-500 mr-1">*</span>手机号</span>
                                <input v-model="addressModal.editForm.phone" placeholder="手机号" type="number" class="flex-1 outline-none text-[16px] text-gray-900 placeholder-gray-300">
                            </div>
                            
                            <!-- 标签 -->
                            <div class="py-5 flex flex-col gap-4">
                                <span class="text-[16px] text-gray-900">地址标签</span>
                                <div class="flex items-center flex-wrap gap-3">
                                    <span v-for="t in ['家', '公司', '学校', '父母', '朋友']" :key="t" 
                                          class="px-5 py-1.5 rounded-full text-[13px] border cursor-pointer transition font-medium"
                                          :class="addressModal.editForm.tag === t ? 'border-[#fadb7e] text-gray-900 bg-[#fef9e8]' : 'border-gray-200 text-gray-600 bg-gray-50'"
                                          @click="addressModal.editForm.tag = t; showCustomTagInput = false;">{{ t }}</span>
                                    
                                    <span class="px-4 py-1.5 rounded-full text-[13px] border cursor-pointer transition font-medium"
                                          :class="showCustomTagInput ? 'border-[#fadb7e] text-gray-900 bg-[#fef9e8]' : 'border-gray-200 text-gray-600 bg-gray-50'"
                                          @click="showCustomTagInput = true">自定义</span>
                                </div>
                                <div v-if="showCustomTagInput" class="w-full">
                                    <input v-model="customTagValue" placeholder="输入自定义标签" class="w-full px-4 py-2 text-[14px] rounded-lg border border-gray-200 outline-none focus:border-[#fadb7e] bg-gray-50">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 底部保存按钮 (橙黄色风格) -->
                    <div class="fixed bottom-0 left-0 w-full bg-transparent p-4 pb-safe z-20 flex justify-center">
                        <button @click="saveAddress" class="w-[90%] bg-[#fbd451] text-gray-900 rounded-xl font-bold text-[17px] py-3.5 shadow-lg active:scale-95 transition">保存地址</button>
                    </div>
                </div>
            </transition>

            <!-- ================= 商品/外卖详情 (带有评论区) ================= -->
            <transition name="app-slide">
                <div v-if="taobaoModal.selectedItem" class="absolute inset-0 z-[50] bg-[#f2f2f6] flex flex-col pb-safe font-sans">
                    <header class="h-[90px] pt-10 px-4 flex justify-between items-center bg-white/90 backdrop-blur sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                        <button @click="taobaoModal.selectedItem = null" class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-800"><i class="fas fa-chevron-left text-sm"></i></button>
                        <span class="font-bold text-[17px] text-gray-900">商品详情</span>
                        <div class="flex gap-2">
                            <button class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-800"><i class="fas fa-share text-sm"></i></button>
                            <button class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-800"><i class="fas fa-ellipsis-h text-sm"></i></button>
                        </div>
                    </header>
                    <div class="flex-1 overflow-y-auto pb-6">
                        <div class="w-full aspect-square bg-gray-50 flex items-center justify-center relative border-b border-gray-100" @click="showTaobaoDesc">
                            <i class="fas" :class="taobaoModal.activeTab === 'takeout' ? 'fa-utensils text-5xl text-gray-300' : 'fa-box-open text-6xl text-gray-300'"></i>
                            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full text-[12px] font-bold text-gray-700 flex items-center gap-1.5 shadow-sm border border-gray-200"><i class="fas fa-search-plus"></i> 点击查看全景描述</div>
                        </div>
                        <div class="bg-white p-5 shadow-sm">
                            <div class="text-3xl font-bold font-mono text-[#2c2c2e] mb-2 leading-none">¥{{ taobaoModal.selectedItem.price }}</div>
                            <h2 class="text-[19px] font-bold text-gray-900 leading-snug tracking-wide">{{ taobaoModal.selectedItem.name }}</h2>
                            <div class="flex justify-between items-center text-[13px] text-gray-500 mt-4 pt-4 border-t border-gray-50">
                                <span>{{ taobaoModal.selectedItem.store }}</span>
                                <span>月销 {{ taobaoModal.selectedItem.sales }}</span>
                                <span>{{ taobaoModal.activeTab === 'takeout' ? '预计30分钟达' : '包邮发货' }}</span>
                            </div>
                        </div>

                        <!-- 评价区 (新增功能) -->
                        <div class="mt-3 bg-white p-5 shadow-sm">
                            <div class="flex justify-between items-center mb-4">
                                <span class="text-[16px] text-gray-900 font-bold">商品评价 ({{ taobaoModal.selectedItem.reviews ? taobaoModal.selectedItem.reviews.length : 0 }})</span>
                                <span class="text-[12px] text-gray-500">查看全部 <i class="fas fa-chevron-right text-[10px]"></i></span>
                            </div>
                            <div v-if="!taobaoModal.selectedItem.reviews || taobaoModal.selectedItem.reviews.length === 0" class="text-sm text-gray-400 py-2">暂无评价</div>
                            <div class="space-y-4">
                                <div v-for="(rev, idx) in taobaoModal.selectedItem.reviews" :key="idx" class="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                    <div class="flex items-center gap-2 mb-2">
                                        <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] overflow-hidden">
                                            <i class="fas" :class="rev.avatarIcon"></i>
                                        </div>
                                        <span class="text-[13px] text-gray-600">{{ rev.user }}</span>
                                        <div class="ml-auto flex text-[#ff9000] text-[10px] gap-0.5">
                                            <i v-for="s in 5" :key="s" class="fas fa-star" :class="s <= rev.rating ? 'text-[#ff9000]' : 'text-gray-200'"></i>
                                        </div>
                                    </div>
                                    <p class="text-[14px] text-gray-800 leading-relaxed text-justify">{{ rev.content }}</p>
                                    <div class="text-[11px] text-gray-400 mt-2">{{ rev.date }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-3 bg-white p-5 shadow-sm">
                            <span class="text-[16px] text-gray-900 font-bold mb-3 block">图文详情</span>
                            <p class="text-[14px] text-gray-600 leading-relaxed text-justify">{{ taobaoModal.selectedItem.desc }}</p>
                        </div>
                    </div>
                    
                    <!-- 详情底部操作栏 -->
                    <div class="bg-white border-t border-gray-200 p-2.5 pb-safe flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.04)] z-10 shrink-0 items-center">
                        <div class="flex flex-col items-center justify-center w-10 text-gray-600 cursor-pointer active:scale-90" @click="showToast('店铺')">
                            <i class="fas fa-store text-xl mb-0.5"></i>
                            <span class="text-[10px] font-medium">店铺</span>
                        </div>
                        <div class="flex flex-col items-center justify-center w-10 text-gray-600 cursor-pointer active:scale-90" @click="showToast('客服')">
                            <i class="fas fa-headset text-xl mb-0.5"></i>
                            <span class="text-[10px] font-medium">客服</span>
                        </div>
                        <!-- 纯图标加入购物车 -->
                        <div class="w-10 h-10 ml-2 bg-gray-100 rounded-full flex items-center justify-center text-gray-800 text-lg cursor-pointer active:bg-gray-200 transition shadow-sm" @click="addToCart">
                            <i class="fas fa-cart-plus"></i>
                        </div>
                        
                        <div class="flex-1 flex gap-2 ml-2">
                            <button @click="requestPayment" class="flex-1 bg-gray-800 text-white rounded-full font-bold text-[14px] active:scale-95 transition shadow-md">找人代付</button>
                            <button @click="openCheckout('direct')" class="flex-1 bg-black text-white rounded-full font-bold text-[14px] shadow-md active:scale-95 transition">立即购买</button>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- ================= 独立结算台 ================= -->
            <transition name="app-slide">
                <div v-if="checkoutModal.show" class="absolute inset-0 z-[80] bg-[#f2f2f6] flex flex-col pb-safe font-sans">
                    <header class="h-[90px] pt-10 px-4 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                        <button @click="checkoutModal.show = false" class="text-gray-900 text-xl w-10"><i class="fas fa-chevron-left"></i></button>
                        <span class="font-bold text-[18px] text-gray-900">确认订单</span>
                        <div class="w-10"></div>
                    </header>
                    <div class="flex-1 overflow-y-auto p-4 space-y-4">
                        <div class="bg-white rounded-[20px] p-5 shadow-sm relative overflow-hidden border border-gray-50 cursor-pointer active:bg-gray-50" @click="openAddressList">
                            <div v-if="defaultAddress" class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0 shadow-sm" :class="defaultAddress.owner === 'me' ? 'bg-[#2c2c2e]' : 'bg-gray-400'">
                                        {{ defaultAddress.owner === 'me' ? '我' : 'TA' }}
                                    </div>
                                    <div>
                                        <div class="font-bold text-[16px] text-gray-900 mb-1 leading-tight">{{ defaultAddress.region }} {{ defaultAddress.detail }}</div>
                                        <div class="text-[13px] text-gray-500 font-medium">{{ defaultAddress.name }} {{ defaultAddress.phone }}</div>
                                    </div>
                                </div>
                                <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
                            </div>
                            <div v-else class="flex items-center justify-between py-3 text-gray-900 font-bold text-[16px]">
                                <span><i class="fas fa-plus-circle mr-2 text-gray-400"></i> 请添加收货地址</span>
                                <i class="fas fa-chevron-right text-gray-300"></i>
                            </div>
                        </div>

                        <div class="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50">
                            <div class="font-bold text-[15px] text-gray-900 border-b border-gray-50 pb-3 mb-4">商品清单</div>
                            <div v-for="(item, idx) in checkoutModal.items" :key="idx" class="flex gap-4 mb-5 last:mb-0">
                                <div class="w-20 h-20 bg-[#f9f9f9] rounded-xl flex items-center justify-center text-gray-300 shrink-0 border border-gray-100"><i class="fas fa-box text-2xl"></i></div>
                                <div class="flex-1 flex flex-col justify-between py-1">
                                    <span class="text-[14px] font-medium text-gray-900 line-clamp-2 leading-snug">{{ item.name }}</span>
                                    <span class="text-[16px] font-bold text-gray-900 font-mono">¥{{ item.price }}</span>
                                </div>
                            </div>
                            <div class="mt-5 pt-4 border-t border-gray-50 flex items-center">
                                <span class="text-[15px] text-gray-800 font-bold w-20">订单备注</span>
                                <input v-model="checkoutModal.note" placeholder="选填，建议留言前先与商家沟通" class="flex-1 text-[14px] text-gray-900 outline-none placeholder-gray-400">
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-3 pb-safe border-t border-gray-100 flex justify-between items-center z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
                        <div class="pl-4 text-gray-500 font-medium">共 {{ checkoutModal.items.length }} 件，合计: <span class="text-[22px] font-bold text-gray-900 font-mono ml-1">¥{{ checkoutModal.totalPrice }}</span></div>
                        <button @click="submitCheckout" class="bg-black text-white px-8 py-3.5 rounded-full font-bold text-[15px] shadow-lg active:scale-95 transition">提交订单</button>
                    </div>
                </div>
            </transition>

            <!-- 选择付款对象 -->
            <transition name="scale">
                <div v-if="taobaoPayTargetModal.show" class="fixed inset-0 z-[120000] flex items-center justify-center bg-black/50 backdrop-blur-sm" @click="taobaoPayTargetModal.show = false">
                    <div class="bg-[#f5f5f5] w-[85%] rounded-[24px] overflow-hidden shadow-2xl flex flex-col" @click.stop>
                        <div class="p-5 border-b border-gray-200 text-center bg-white">
                            <span class="font-bold text-[17px] text-gray-900">{{ taobaoPayTargetModal.isRequestPay ? '发送代付请求' : '确认付款' }}</span>
                        </div>
                        <div class="p-5 bg-[#f5f5f5] flex flex-col gap-3">
                            <button v-if="!taobaoPayTargetModal.isRequestPay" @click="confirmPayTaobao('self')" class="w-full py-4 bg-white rounded-[16px] text-[16px] font-bold text-gray-900 active:bg-gray-50 transition border border-gray-100 shadow-sm">余额支付 (¥{{ checkoutModal.totalPrice }})</button>
                            <button v-if="wechatState.activeSession" @click="confirmPayTaobao('ai')" class="w-full py-4 bg-white rounded-[16px] text-[16px] font-bold text-gray-900 active:bg-gray-50 transition border border-gray-100 shadow-sm">
                                {{ taobaoPayTargetModal.isRequestPay ? '发给 ' : '找人代付 (' }}{{ wechatState.activeSession?.isGroup ? '群聊' : wechatState.activeSession?.name }}{{ taobaoPayTargetModal.isRequestPay ? '' : ')' }}
                            </button>
                        </div>
                        <div class="p-4 border-t border-gray-200 bg-white">
                            <button @click="taobaoPayTargetModal.show = false" class="w-full bg-gray-100 text-gray-700 py-3.5 rounded-[16px] text-[16px] font-bold active:bg-gray-200 transition">取消</button>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- 底部导航 -->
            <div v-if="taobaoModal.activeTab !== 'search' && !taobaoModal.selectedItem && !checkoutModal.show && !addressModal.showList && !addressModal.showEdit" class="h-[75px] pt-1.5 bg-white border-t border-gray-100 flex items-center justify-around shrink-0 pb-safe z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                <div @click="taobaoModal.activeTab = 'home'" class="flex flex-col items-center gap-1 cursor-pointer transition w-14" :class="taobaoModal.activeTab === 'home' ? 'text-[#2c2c2e]' : 'text-gray-400'">
                    <i class="fas fa-home text-[22px]"></i><span class="text-[10px] font-bold">首页</span>
                </div>
                <div @click="taobaoModal.activeTab = 'takeout'" class="flex flex-col items-center gap-1 cursor-pointer transition w-14" :class="taobaoModal.activeTab === 'takeout' ? 'text-[#2c2c2e]' : 'text-gray-400'">
                    <i class="fas fa-motorcycle text-[22px]"></i><span class="text-[10px] font-bold">外卖</span>
                </div>
                <div @click="taobaoModal.activeTab = 'msg'" class="flex flex-col items-center gap-1 cursor-pointer transition w-14" :class="taobaoModal.activeTab === 'msg' ? 'text-[#2c2c2e]' : 'text-gray-400'">
                    <i class="fas fa-comment-dots text-[22px]"></i><span class="text-[10px] font-bold">消息</span>
                </div>
                <div @click="taobaoModal.activeTab = 'cart'" class="flex flex-col items-center gap-1 cursor-pointer transition w-14" :class="taobaoModal.activeTab === 'cart' ? 'text-[#2c2c2e]' : 'text-gray-400'">
                    <i class="fas fa-shopping-cart text-[22px]"></i><span class="text-[10px] font-bold">购物车</span>
                </div>
                <div @click="taobaoModal.activeTab = 'me'" class="flex flex-col items-center gap-1 cursor-pointer transition w-14" :class="taobaoModal.activeTab === 'me' ? 'text-[#2c2c2e]' : 'text-gray-400'">
                    <i class="fas fa-user text-[22px]"></i><span class="text-[10px] font-bold">我的</span>
                </div>
            </div>
        </div>
    `
};
