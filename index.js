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

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { existsSync } = require("fs");
const { mkdir, writeFile, readFile } = require("fs/promises");
const { join } = require("path");
const { setTimeout } = require("timers/promises");
let answerspath = "";
switch (process.platform) {
    case "win32":
        answerspath = `${process.env.APPDATA}/NetHolidayCracker/`;
        break;
    case "darwin":
        answerspath = `${process.env.HOME}/Library/Application Support/NetHolidayCracker/`;
        break;
    case "linux":
        answerspath = `${process.env.HOME}/.config/NetHolidayCracker/`;
        break;
    default:
        break;
}
/** @type {any[]} */
let answers = [];
CheckFileExists();
GetAnswerFromFile().then((answersfromfile) => {
    answers = JSON.parse(answersfromfile);
});
let cracktimes = -1;

app.on("ready", () => {
    const window = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: join(__dirname, "preload.js"),
            nodeIntegration: true,
        },
    });

    window.loadURL("https://netholiday.kh.edu.tw/web_index.action");

    try {
        window.webContents.debugger.attach("1.1");
    } catch (error) {
        console.error(error);
    }

    window.webContents.setWindowOpenHandler((handler) => {
        window.loadURL(handler.url);
        return {
            action: "deny",
        };
    });

    ipcMain.on(
        "StartCracker",
        /** @param {number} index */
        async (_event, index) => {
            await setTimeout(400);
            window.webContents.send("SelectAnswer", index);
        }
    );

    ipcMain.on("ShowPopup", async (_event) => {
        await dialog.showMessageBox(window, {
            type: "info",
            title: "通知",
            message: "開始刷題\n請勿對視窗進行任何操作",
            buttons: ["彳亍!"],
        });
    });

    ipcMain.on("CrackDone", async (_event, index) => {
        cracktimes++;
        dialog.showMessageBox(window, {
            type: "info",
            title: "通知",
            message: `已完成刷題 ${cracktimes + 1}/4\n請勿繼續操作!!${
                cracktimes < 3 ? "\n請等待下一輪刷題在一分鐘後自動開始!!" : ""
            }`,
            buttons: ["彳亍!"],
        });
        if (cracktimes < 3) {
            await setTimeout(60000);
            window.webContents.send("ContinueCrack", index);
        } else {
            cracktimes = -1;
            window.webContents.send("StartAnswer", index);
        }
    });

    window.webContents.debugger.on(
        "message",
        async (_event, method, params) => {
            if (
                method === "Network.responseReceived" &&
                params.response.url.includes("result_list.action")
            ) {
                const { body } = await window.webContents.debugger.sendCommand(
                    "Network.getResponseBody",
                    { requestId: params.requestId }
                );
                /** @type {any[]} */
                answers = [
                    ...new Set([
                        ...answers,
                        ...JSON.parse(body).data.list.map((answer) => {
                            return {
                                id: answer.id,
                                answer: answer.c == "Y" ? answer.s : answer.c,
                            };
                        }),
                    ]),
                ];
            }
        }
    );

    window.webContents.debugger.sendCommand("Network.enable");
});

async function WriteAnswer() {
    return await writeFile(
        `${answerspath}/answers.json`,
        JSON.stringify(answers)
    );
}

async function GetAnswerFromFile() {
    const jsonpath = `${answerspath}/answers.json`;
    if (!existsSync(jsonpath)) await writeFile(jsonpath, "[]");
    return await readFile(jsonpath, {
        encoding: "utf8",
    });
}

app.on("window-all-closed", async () => {
    await WriteAnswer();
    app.exit();
});

async function CheckFileExists() {
    if (!existsSync(answerspath)) await mkdir(answerspath);
}
