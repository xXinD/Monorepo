class WebSocketClient {
  private ws: WebSocket | null = null;

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
          console.log("Connected to WebSocket server");
          resolve();
        };
        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  sendMessage(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.error("WebSocket is not open");
    }
  }

  receiveMessage(callback: (message: string) => void): void {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        callback(event.data);
      };
    }
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export default WebSocketClient;
