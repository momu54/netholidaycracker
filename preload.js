/*
                       _oo0oo_
                      o8888888o
                      88" . "88
                      (| -_- |)
                      0\  =  /0
                    ___/`---'\___
                  .' \\|     | '.
                 / \\|||  :  ||| \
                / _||||| -:- |||||- \
               |   | \\\  -  / |   |
               | \_|  ''\---/''  |_/ |
               \  .-\__  '-'  ___/-. /
             ___'. .'  /--.--\  `. .'___
          ."" '<  `.___\_<|>_/___.' >' "".
         | | :  `- \`.;`\ _ /`;.`/ - ` : | |
         \  \ `_.   \_ __\ /__ _/   .-` /  /
     =====`-.____`.___ \_____/___.-`___.-'=====
                       `=---='


     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

               佛主保佑         永無BUG
*/

const { ipcRenderer } = require('electron');
/** @type {HTMLCollectionOf<HTMLDivElement>} */
let subjects;
/** @type {HTMLLIElement[]} */
let answers;

function sleep(delay) {
	return new Promise(function (resolve) {
		setTimeout(resolve, delay);
	});
}

console.log('Preload script injected!');
if (window.location.href.includes('exam.action')) {
	subjects =
		/** @type {HTMLCollectionOf<HTMLDivElement>} */
		(document.getElementsByClassName('icon-item'));
	const interval = setInterval(() => {
		if (subjects.length == 8) {
			clearInterval(interval);
			CreateExamEventHandler();
		}
	}, 100);
} else if (window.location.href.includes('result.action')) {
	ExitExam();
}

async function ExitExam() {
	await sleep(400);
	document.getElementById('examOver')?.click();
}

function CreateExamEventHandler() {
	[...subjects].forEach((subject, index) =>
		subject.addEventListener('mousedown', async (event) => {
			if (event.button != 1) return;
			event.preventDefault();
			subject.click();
			ipcRenderer.send('StartCracker', index);
		})
	);
}

/** @param {number} index */
async function ClickAnswer(index) {
	console.log(answers.length);
	if (!document.getElementById('answer')) return;
	ipcRenderer.send('ShowPopup');
	for (const _answer of answers) {
		await sleep(400);
		/** @type {HTMLInputElement} */
		(
			/** @type {HTMLDivElement} */
			(document.getElementById('answer')).firstElementChild?.firstElementChild
				?.firstElementChild
		).setAttribute('checked', '');
		console.log('Tryed to click answer.');
		await sleep(400);
		/** @type {HTMLDivElement} */
		(document.getElementsByClassName('next')[0]).click();
		console.log('Tryed to click next button.');
	}
	await sleep(400);
	/** @type {HTMLButtonElement} */
	(document.getElementById('examOver')).click();
	await sleep(400);
	/** @type {HTMLButtonElement} */
	(document.querySelector('#exam-modal-footer .btn.btn-primary')).click();
	ipcRenderer.send('CrackDone', index);
}

ipcRenderer.on('SelectAnswer', async (_event, index) => {
	answers = [
		.../** @type {HTMLCollectionOf<HTMLLIElement>} */
		(document.getElementsByClassName('link-list')),
	];
	await ClickAnswer(index);
});

ipcRenderer.on(
	'ContinueCrack',
	/** @param {number} index */
	(_event, index) => {
		const subject = [...subjects][index];
		console.log(index);
		subject.click();
		ipcRenderer.send('StartCracker', index);
	}
);
