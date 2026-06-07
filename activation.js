// activation.js - 设备指纹与激活逻辑

// 1. 生成设备硬件指纹 (跨浏览器也能尽量保持一致)
function generateDeviceFingerprint() {
    const screenInfo = window.screen.width + 'x' + window.screen.height + 'x' + window.screen.colorDepth;
    const cores = navigator.hardwareConcurrency || 2;
    let renderer = 'unknown';
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    } catch(e) {}
    
    const raw = screenInfo + cores + renderer;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

// 2. 根据指纹和密钥类型生成验证哈希
function generateToken(deviceId, type) {
    let hash = 0;
    let str = deviceId + type + "AOVEIN_SEC_V1";
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    let code = Math.abs(hash).toString(36).toUpperCase().padStart(8, '0');
    return type === 'ACT' ? `AOV-${code.slice(0,4)}-${code.slice(4)}` : `REV-${code.slice(0,4)}-${code.slice(4)}`;
}

// 3. 全局状态检查与初始化
window.checkActivationState = async function() {
    const deviceId = generateDeviceFingerprint();
    document.getElementById('device-id-display').innerText = deviceId;
    
    // 检查是否被注销 (由于要防清理，借助之前的 persist-storage)
    let isRevoked = localStorage.getItem('aovein_revoked') === 'true';
    if (!isRevoked && window.loadFromSafeStorage) {
        const safeRevoke = await window.loadFromSafeStorage('aovein_revoked');
        if (safeRevoke === 'true') isRevoked = true;
    }

    if (isRevoked) {
        alert("系统提示：该设备因安全原因已被永久注销，拒绝访问。");
        document.getElementById('app').style.display = 'none';
        document.getElementById('activation-screen').classList.remove('hidden-screen');
        document.getElementById('activate-btn').innerText = "设备已注销";
        return;
    }

    const isActivated = localStorage.getItem('aovein_activated') === 'true';
    
    if (isActivated) {
        document.getElementById('app').style.display = 'flex';
        document.getElementById('activation-screen').style.display = 'none';
    } else {
        document.getElementById('app').style.display = 'none';
        document.getElementById('activation-screen').classList.remove('hidden-screen');
    }
};

// 4. UI 交互事件绑定
document.addEventListener('DOMContentLoaded', () => {
    const agreeCheck = document.getElementById('agree-check');
    const activateBtn = document.getElementById('activate-btn');
    const showDisclaimer = document.getElementById('show-disclaimer');
    const modal = document.getElementById('disclaimer-modal');
    const modalBtn = document.getElementById('modal-agree-btn');
    
    let countdown = 5;
    let timer = null;

    // 勾选免责声明才能输入
    agreeCheck.addEventListener('change', (e) => {
        activateBtn.disabled = !e.target.checked;
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => input.disabled = !e.target.checked);
    });

    // 打开弹窗
    showDisclaimer.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('show');
        modalBtn.disabled = true;
        countdown = 5;
        modalBtn.innerText = `请认真阅读 (${countdown}s)`;
        
        timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                modalBtn.innerText = `请认真阅读 (${countdown}s)`;
            } else {
                clearInterval(timer);
                modalBtn.disabled = false;
                modalBtn.innerText = "我已了解并同意";
            }
        }, 1000);
    });

    // 关闭弹窗
    modalBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        agreeCheck.checked = true;
        activateBtn.disabled = false;
        document.querySelectorAll('.form-input').forEach(input => input.disabled = false);
    });

    // 点击激活
    activateBtn.addEventListener('click', async () => {
        const code = document.getElementById('code-input').value.trim().toUpperCase();

        if (!code) {
            alert("激活码不能为空！");
            return;
        }

        const deviceId = document.getElementById('device-id-display').innerText;
        const validActCode = generateToken(deviceId, 'ACT');
        const validRevCode = generateToken(deviceId, 'REV');

        // 检测注销码
        if (code === validRevCode) {
            localStorage.setItem('aovein_revoked', 'true');
            if (window.saveToSafeStorage) window.saveToSafeStorage('aovein_revoked', 'true');
            alert("设备注销成功！此设备已被锁定。");
            location.reload();
            return;
        }

        // 检测激活码
        if (code === validActCode) {
            // 只记录设备已激活状态，不再存储账号密码
            localStorage.setItem('aovein_activated', 'true');
            
            const screen = document.getElementById('activation-screen');
            screen.style.transform = 'scale(1.1)'; 
            screen.style.opacity = '0';
            setTimeout(() => { 
                screen.classList.add('hidden-screen'); 
                document.getElementById('app').style.display = 'flex'; 
            }, 600);
        } else {
            document.getElementById('code-input').classList.add('error');
            setTimeout(() => document.getElementById('code-input').classList.remove('error'), 1000);
            alert("激活码无效，请检查后重试！");
        }
    });
});
