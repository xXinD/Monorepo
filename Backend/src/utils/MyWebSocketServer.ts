import WebSocket, { Server as WebSocketServer } from "ws";

class MyWebSocketServer {
  private static instance: MyWebSocketServer;

  private wss: WebSocketServer;

  private constructor(port: number) {
    this.wss = new WebSocketServer({ port });

    this.wss.on("connection", (ws) => {
      console.log("Client connected");

      ws.on("message", (message) => {
        console.log("Received:", message);
      });
    });

    console.log(`WebSocket server is running on ws://localhost:${port}`);
  }

  public static getInstance(port: number): MyWebSocketServer {
    if (!MyWebSocketServer.instance) {
      MyWebSocketServer.instance = new MyWebSocketServer(port);
    }
    return MyWebSocketServer.instance;
  }

  public sendMessage(message: string): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // 这里使用从"ws"库导入的WebSocket
        client.send(message);
      }
    });
  }

  public getAddress(): string {
    const serverAddress = this.wss.address();
    const host = "localhost"; // 你可以使用一个环境变量或配置文件来设置主机名
    const port =
      typeof serverAddress === "string" ? serverAddress : serverAddress?.port;
    return `ws://${host}:${port}`;
  }
}

export default MyWebSocketServer;
