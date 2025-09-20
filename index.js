import init, { run_wasm } from './wasm/rust_ant.js';

class RustAntPlayground {
    constructor() {
        this.wasmModule = null;
        this.isInitialized = false;
        this.initElements();
        this.bindEvents();
        this.initWasm();
    }

    initElements() {
        this.codeInput = document.getElementById('codeInput');
        this.fileNameInput = document.getElementById('fileName');
        this.runBtn = document.getElementById('runBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.output = document.getElementById('output');
        this.status = document.getElementById('status');
    }

    bindEvents() {
        this.runBtn.addEventListener('click', () => this.runCode());
        this.clearBtn.addEventListener('click', () => this.clearOutput());
        
        // 添加键盘快捷键支持
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            }
        });
    }

    async initWasm() {
        try {
            this.showStatus('正在加载WebAssembly模块...', 'loading');
            
            // 初始化WASM模块
            this.wasmModule = await init();
            this.isInitialized = true;
            
            this.showStatus('WebAssembly模块加载成功!', 'success');
            this.runBtn.disabled = false;
            
            console.log('WASM模块初始化完成');
        } catch (error) {
            console.error('WASM模块加载失败:', error);
            this.showStatus(`WASM模块加载失败: ${error.message}`, 'error');
            this.runBtn.disabled = true;
        }
    }

    async runCode() {
        if (!this.isInitialized) {
            this.showStatus('WebAssembly模块尚未加载完成，请稍候...', 'error');
            return;
        }

        const code = this.codeInput.value.trim();
        const fileName = this.fileNameInput.value.trim() || 'main.ant';

        if (!code) {
            this.showStatus('请输入要运行的代码', 'error');
            return;
        }

        try {
            this.showStatus('正在运行代码...', 'loading');
            this.runBtn.disabled = true;
            this.runBtn.textContent = '⏳ 运行中...';

            // 清空之前的输出
            this.output.textContent = '';

            // 捕获console.log输出
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            
            let outputText = '';
            
            console.log = (...args) => {
                outputText += args.join(' ') + '\n';
                this.output.textContent = outputText;
            };
            
            console.error = (...args) => {
                outputText += args.join(' ') + '\n';
                this.output.textContent = outputText;
            };
            
            console.warn = (...args) => {
                outputText += args.join(' ') + '\n';
                this.output.textContent = outputText;
            };

            // 调用WASM函数
            run_wasm(code, fileName);

            // 恢复原始console函数
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;

            this.showStatus('代码运行完成!', 'success');
            
            if (!outputText.trim()) {
                this.output.textContent = '代码已执行，但没有输出内容。';
            }

        } catch (error) {
            console.error('代码运行错误:', error);
            this.showStatus(`代码运行失败: ${error.message}`, 'error');
            this.output.textContent = `错误: ${error.message}`;
        } finally {
            this.runBtn.disabled = false;
            this.runBtn.textContent = '▶️ 运行代码';
        }
    }

    clearOutput() {
        this.output.textContent = '输出已清空，点击"运行代码"按钮开始...';
        this.status.innerHTML = '';
    }

    showStatus(message, type) {
        this.status.innerHTML = `<div class="status ${type}">${message}</div>`;
    }

    // 添加示例代码加载功能
    loadExample(exampleCode) {
        this.codeInput.value = exampleCode;
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new RustAntPlayground();
    
    // 添加示例代码按钮功能
    const exampleButtons = document.querySelectorAll('.example-code pre code');
    exampleButtons.forEach(button => {
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => {
            app.loadExample(button.textContent);
        });
    });

    // 添加代码高亮功能（简单版本）
    const codeInput = document.getElementById('codeInput');
    codeInput.addEventListener('input', () => {
        // 这里可以添加简单的语法高亮
        // 为了简化，我们暂时不实现
    });

    // 添加代码格式化功能
    window.formatCode = () => {
        const code = codeInput.value;
        // 简单的代码格式化
        const formatted = code
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .replace(/\n{3,}/g, '\n\n'); // 移除多余的空行
        
        codeInput.value = formatted;
    };

    // 添加保存/加载代码功能
    window.saveCode = () => {
        const code = codeInput.value;
        const fileName = document.getElementById('fileName').value;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    window.loadCode = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.rs,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    codeInput.value = e.target.result;
                    document.getElementById('fileName').value = file.name;
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    console.log('Ant Language Playground 已初始化');
    console.log('快捷键: Ctrl+Enter 运行代码');
    console.log('可用函数: formatCode(), saveCode(), loadCode()');
});

// 导出到全局作用域以便调试
window.AntLanguagePlayground = RustAntPlayground;
