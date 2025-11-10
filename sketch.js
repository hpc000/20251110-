// ==== 視覺效果 (保留原本的動態背景) ====
let objs = [];
let colors = ['#0065CB', '#FF0042', '#758FE4', '#FB4103', '#26A692', '#FAAB0C', '#F9E000', '#FD9B85', '#f9f8f8'];

// 選單相關
let menuDiv;
let menuItem1, menuItem2, menuItem3;
const menuWidth = 100;

// ==== 測驗系統變數 ====
let tableData;
let questions = []; // 由 CSV 解析而來
let quizQuestions = []; // 目前測驗的 5 題
let currentIndex = 0;
let score = 0;
let state = 'idle'; // idle, quiz, review

// DOM 元件
let quizDiv, qTextDiv, optionsDiv, startBtn, nextBtn, resultDiv, feedbackDiv;

// 圖片變數
let myImage;

function preload() {
	// 讀取 CSV（要求有 header: question,optionA,optionB,optionC,optionD,answer,explanation）
	tableData = loadTable('questions.csv', 'csv', 'header');
	// 載入圖片（從 images 資料夾中載入）
	myImage = loadImage('images/photo.jpg');
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	rectMode(CENTER);
	addObj();
	setupMenu();

	// 設置文字樣式
	textSize(40);
	textAlign(CENTER, CENTER);

	// 解析 CSV
	parseQuestionsFromTable();

	// 建立測驗 UI
	createQuizUI();
}

function draw() {
	background('#e5f3ff'); // 改為淺藍色背景
	
	for (let i of objs) {
		i.show();
		i.move();
	}

	for (let i = 0; i < objs.length; i++) {
		if (objs[i].isDead) objs.splice(i, 1);
	}

	if (frameCount % 3 == 0) {
		if (objs.length < 50) addObj();
	}

	// 在畫面中間顯示文字，添加特效
	let hue = (frameCount * 0.5) % 360; // 漸變色彩
	let yOffset = sin(frameCount * 0.05) * 15; // 上下浮動效果
	
	// 設定文字樣式
	colorMode(HSB);
	
	// 添加文字陰影效果
	push();
	fill(hue, 80, 60, 0.3);
	text('412737057許沛O', width/2 + 2, height/2 - 50 + yOffset + 2);
	pop();
	
	// 主要文字（位置在上方）
	fill(hue, 80, 100);
	text('412737057許沛O', width/2, height/2 - 50 + yOffset);
	
	// 在文字下方顯示圖片（添加特效）
	if (myImage) {
		// 計算基本圖片大小
		let baseWidth = 200;
		let baseHeight = (myImage.height * baseWidth) / myImage.width;
		
		// 呼吸效果：尺寸微調
		let scale = 1 + sin(frameCount * 0.03) * 0.05; // 大小變化範圍 ±5%
		let imgWidth = baseWidth * scale;
		let imgHeight = baseHeight * scale;
		
		// 輕微旋轉效果
		let rotation = sin(frameCount * 0.02) * 0.1; // 旋轉角度範圍約 ±5.7度
		
		push();
		translate(width/2, height/2 + 80);
		rotate(rotation);
		
		// 顯示圖片
		imageMode(CENTER);
		image(myImage, 0, 0, imgWidth, imgHeight);
		pop();
	}
	
	// 恢復顏色模式
	colorMode(RGB);

	handleMenuSlide();
}

// ---------------- quiz CSV parsing ----------------
function parseQuestionsFromTable() {
	questions = [];
	if (!tableData || tableData.getRowCount() === 0) {
		console.warn('questions.csv 空或找不到，請確認檔案放在專案根目錄且有 header。');
		return;
	}
	for (let r = 0; r < tableData.getRowCount(); r++) {
		const row = tableData.getRow(r).obj;
		// 使用欄位名稱容錯
		const q = row.question || row.Question || '';
		const a = row.optionA || row.optiona || row.A || '';
		const b = row.optionB || row.optionb || row.B || '';
		const c = row.optionC || row.optionc || row.C || '';
		const d = row.optionD || row.optiond || row.D || '';
		const ans = (row.answer || row.Answer || '').toString().trim();
		const exp = row.explanation || row.Explanation || '';
		if (q && a && b && c && d && ans) {
			questions.push({ question: q, options: [a, b, c, d], answer: ans, explanation: exp });
		}
	}
}

// ---------------- UI 建立 ----------------
function createQuizUI() {
	quizDiv = createDiv('');
	// 中央面板樣式（也會加上 CSS class）
	quizDiv.addClass('quiz-panel');
	quizDiv.style('position', 'fixed');
	quizDiv.style('left', '50%');
	quizDiv.style('top', '50%');
	quizDiv.style('transform', 'translate(-50%, -50%)');
	quizDiv.style('width', '600px');
	quizDiv.style('max-width', '94vw');
	quizDiv.style('background', 'rgba(255,255,255,0.98)');
	quizDiv.style('padding', '18px');
	quizDiv.style('border-radius', '14px');
	quizDiv.style('box-shadow', '0 10px 30px rgba(0,0,0,0.18)');
	quizDiv.style('z-index', '200');
	quizDiv.style('font-family', 'system-ui, -apple-system, Roboto, "Noto Sans", sans-serif');

	createElement('h3', '程式選擇題測驗').parent(quizDiv);

	qTextDiv = createDiv('按下「開始測驗」取得 5 題');
	qTextDiv.parent(quizDiv);
	qTextDiv.style('margin-bottom', '10px');

	optionsDiv = createDiv('');
	optionsDiv.parent(quizDiv);

	startBtn = createButton('開始測驗 (5 題)');
	startBtn.parent(quizDiv);
	startBtn.addClass('quiz-btn primary');
	startBtn.style('margin-top', '10px');
	startBtn.mousePressed(() => {
		if (questions.length < 5) {
			alert('題庫不足：請在 questions.csv 補至少 5 題。');
			return;
		}
		startQuiz();
	});

	nextBtn = createButton('下一題');
	nextBtn.parent(quizDiv);
	nextBtn.addClass('quiz-btn');
	nextBtn.hide();
	nextBtn.mousePressed(() => nextQuestion());

	resultDiv = createDiv('');
	resultDiv.parent(quizDiv);
	resultDiv.style('margin-top', '12px');

	feedbackDiv = createDiv('');
	feedbackDiv.parent(quizDiv);
	feedbackDiv.style('margin-top', '8px');

	// 預設不在主畫面顯示測驗面板，等使用者從選單啟動
	quizDiv.hide();
}

// ---------------- quiz flow ----------------
function startQuiz() {
	// 亂數取 5 題
	quizQuestions = shuffle(Array.from(questions)).slice(0, 5);
	currentIndex = 0;
	score = 0;
	state = 'quiz';
	startBtn.hide();
	resultDiv.html('');
	feedbackDiv.html('');
	showQuestion();
}

function showQuestion() {
	clearOptions();
	const qObj = quizQuestions[currentIndex];
	qTextDiv.html(`<strong>第 ${currentIndex + 1} 題：</strong> ${qObj.question}`);
	for (let i = 0; i < qObj.options.length; i++) {
		const opt = qObj.options[i];
		const label = String.fromCharCode(65 + i); // A B C D
		const btn = createButton(`${label}. ${opt}`);
		btn.parent(optionsDiv);
		btn.addClass('quiz-btn option-btn');
		btn.style('display', 'block');
		btn.style('width', '100%');
		btn.style('text-align', 'left');
		btn.style('margin', '8px 0');
		btn.mousePressed(((lbl, b, explanation) => {
			return () => handleAnswer(lbl, b, explanation);
		})(label, opt, qObj.explanation));
	}
}

function clearOptions() {
	optionsDiv.html('');
}

function handleAnswer(label, optionText, explanation) {
	// 禁止重覆點擊：移除所有按鈕的事件
	const qObj = quizQuestions[currentIndex];
	// 計分
	if (label.toUpperCase() === qObj.answer.toString().trim().toUpperCase()) {
		score += 1;
		feedbackDiv.html(`<span style="color:green">答對！</span> ${explanation || ''}`);
	} else {
		feedbackDiv.html(`<span style="color:red">答錯，正確答案：${qObj.answer}</span><br>${explanation || ''}`);
	}
	// 顯示下一題按鈕或結束
	nextBtn.show();
	// 將當前選項鎖定（移除按鈕）
	const children = optionsDiv.elt.querySelectorAll('button');
	children.forEach(b => b.disabled = true);
}

function nextQuestion() {
	nextBtn.hide();
	currentIndex += 1;
	feedbackDiv.html('');
	if (currentIndex >= quizQuestions.length) {
		endQuiz();
	} else {
		showQuestion();
	}
}

function endQuiz() {
	state = 'review';
	clearOptions();
	qTextDiv.html('測驗結束');
	const pct = Math.round((score / quizQuestions.length) * 100);
	let msg = '';
	if (pct === 100) msg = '完美！你對程式很有把握 🎉';
	else if (pct >= 80) msg = '表現很好，繼續加油！';
	else if (pct >= 50) msg = '有基礎概念，建議複習錯誤題目。';
	else msg = '建議多加練習基礎觀念與語法。';
	resultDiv.html(`<strong>分數：${score} / ${quizQuestions.length} (${pct}%)</strong><br>${msg}`);

	// 顯示重測按鈕
	startBtn.html('再測一次');
	startBtn.show();

	// 簡單的互動效果：依分數灑 confetti
	if (pct >= 60) {
		fireConfetti();
	}
}

function fireConfetti() {
	// 簡易的彩帶粒子效果：產生一些小物件
	for (let i = 0; i < 30; i++) {
		objs.push(new ROK(random(width), random(-200, 0), random(8, 24), 0));
	}
}

// ================= 原有動態物件類別與函式 =================
function easeInOutQuart(x) {
	return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

function addObj() {
	for (let i = 0; i < 1; i++) {
		objs.push(new ROK(random(width), random(width), random(60, 120), 0));
	}
}

class ROK {
	constructor(x, y, w, t) {
		this.x = x;
		this.y = y;
		this.w = w;

		this.bw1 = 0;
		this.ew1 = w;
		this.bw2 = 0;
		this.ew2 = w * random(0.1, 0.4);
		this.w1 = this.bw1;
		this.w2 = this.bw2;

		this.ptn = int(random(8, 30));
		this.ewh = random(0.2, 0.35);
		this.ehh = random(0.05, 0.1);
		this.esh = random(0.25, 0.35);

		this.t = t;
		this.t1 = 20;
		this.t2 = this.t1 + 30;
		this.t3 = this.t2 + 20;

		this.ang = random(10);

		this.col1 = random(colors);
		this.col2 = random(colors);

		this.as = random(-1, 1) * 0.02;
		this.ys = -width * 0.001;

		this.xs = random(-1, 1) * width * 0.001;

		this.isDead = false;
	}

	show() {
		push();
		translate(this.x, this.y);
		rotate(this.ang);
		noStroke();
		fill(this.col1);
		for (let i = 0; i < this.ptn; i++) {
			rotate(TAU / this.ptn);
			ellipse(this.w1 * this.esh, 0, this.w1 * this.ewh, this.w1 * this.ehh);
		}
		fill(this.col2);
		circle(0, 0, this.w2);
		pop();
	}

	move() {
		if (0 < this.t && this.t < this.t2) {
			let n = norm(this.t, 0, this.t2 - 1);
			this.w2 = lerp(this.bw2, this.ew2, easeInOutQuart(n));
		}
		if (this.t1 < this.t && this.t < this.t3) {
			let n = norm(this.t, this.t1, this.t3 - 1);
			this.w1 = lerp(this.bw1, this.ew1, easeInOutQuart(n));
		}
		this.y += this.ys;
		this.ys += 0.02;

		if (this.y > height + this.w) {
			this.isDead = true;
		}
		this.t++;
		this.ang += this.as;
		this.x += this.xs;
	}
}

// ---------------- 選單 (保留原本功能) ----------------
function setupMenu() {
	menuDiv = createDiv('');
	menuDiv.style('position', 'fixed');
	menuDiv.style('top', '0');
	menuDiv.style('left', `-${menuWidth}px`);
	menuDiv.style('width', `${menuWidth}px`);
	menuDiv.style('height', '100vh');
	menuDiv.style('background-color', 'rgba(255, 255, 255, 0.5)');
	menuDiv.style('transition', 'left 0.3s ease');
	menuDiv.style('padding', '10px 0');
	menuDiv.style('box-sizing', 'border-box');
	menuDiv.style('z-index', '100');

	menuItem1 = createMenuItem('單元一作品');
	menuItem2 = createMenuItem('單元一筆記');
	menuItem3 = createMenuItem('測驗卷');

	menuDiv.child(menuItem1);
	menuDiv.child(menuItem2);
	menuDiv.child(menuItem3);
}

function createMenuItem(text) {
	let item = createDiv(text);
	item.style('color', 'black');
	item.style('font-size', '15px');
	item.style('padding', '10px');
	item.style('cursor', 'pointer');
	item.style('text-align', 'center');
	item.style('margin-bottom', '10px');
	item.style('user-select', 'none');
	item.style('transition', 'color 0.1s');
	item.mouseOver(() => item.style('color', 'red'));
	item.mouseOut(() => item.style('color', 'black'));
	item.mousePressed(() => {
		if (text === '單元一作品') {
			window.location.href = 'https://hpc000.github.io/20251014/';
		} else if (text === '單元一筆記') {
			window.location.href = 'https://hackmd.io/@hhpc/Hy5Rk-zpxe/edit';
		} else if (text === '測驗卷') {
			// 顯示測驗面板，但不立即開始測驗，讓使用者在面板按下「開始測驗」
			if (typeof quizDiv !== 'undefined' && quizDiv) {
				quizDiv.show();
				// 重置面板狀態
				if (typeof startBtn !== 'undefined' && startBtn) {
					startBtn.show();
					startBtn.html('開始測驗 (5 題)');
				}
				if (typeof nextBtn !== 'undefined' && nextBtn) nextBtn.hide();
				if (typeof resultDiv !== 'undefined' && resultDiv) resultDiv.html('');
				if (typeof feedbackDiv !== 'undefined' && feedbackDiv) feedbackDiv.html('');
				if (typeof clearOptions === 'function') clearOptions();
				if (typeof qTextDiv !== 'undefined' && qTextDiv) qTextDiv.html('按下「開始測驗」取得 5 題');
			}
		} else {
			console.log(`${text} 被點擊了`);
		}
	});
	return item;
}

function handleMenuSlide() {
	const slideInZone = 100;
	if (mouseX < slideInZone) {
		menuDiv.style('left', '0px');
	} else {
		menuDiv.style('left', `-${menuWidth}px`);
	}
}