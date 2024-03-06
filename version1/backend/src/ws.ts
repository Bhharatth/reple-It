import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { TerminalManager } from "./pty";
import { fetchS3Folder, saveToS3 } from "./aws";
import path from "path";
import { fetchDir, fetchFileContent, saveFile } from "./fs";




const terminalManager = new TerminalManager();

export function initws(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        }
    });

    io.on("connection", async (socket) => {
        const replId = socket.handshake.query.roomId as string;

        if (!replId) {
            socket.disconnect();
            terminalManager.clear(socket.id)
            return;
        };
        await fetchS3Folder(`code/${replId}`, path.join(__dirname, `../tmp/${replId}`));
        socket.emit("loaded", {
            rootContent: await fetchDir(path.join(__dirname, `../tmp/${replId}`), "")
        })
    });
};

function initHandlers(socket: Socket, replId: string) {

    socket.on("disconnect", () => {
        console.log('user disconnected');
    });

    socket.on("fetchDir", async (dir: string, callback) => {
        const dirPath = path.join(__dirname, `../tmp/${replId}/${dir}`);
        const contents = await fetchDir(dirPath, dir);
        callback(contents);
    });

    socket.on("fetchContent", async ({ path: filePath }: { path: string }, callback) => {
        const fullPath = path.join(__dirname, `../tmp/${replId}/${filePath}`);
        const data = await fetchFileContent(fullPath);
        callback(data);
    });


    socket.on("updateContent", async ({ path: filePath, content }: { path: string, content: string }) => {
        const fullPath = path.join(__dirname, `../tmp/${replId}/${filePath}`);
        await saveFile(fullPath, content);
        await saveToS3(`code/${replId}`, filePath, content);
    });

    socket.on('requestTerminal', async () => {
        terminalManager.createPty(socket.id, replId, (data, id) => {
            socket.emit("teminal", {
                data: Buffer.from(data, "utf-8")
            });
        });
    });

    socket.on('terminalData', async ({ data }: { data: string, terminalId: number }) => {
          terminalManager.write(socket.id, data);
    });
}