import NodeMediaServer from "node-media-server";

class SingletonNMS {
  private static instance: SingletonNMS;

  private nms: any;

  private config = {
    rtmp: {
      port: 1935,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60,
    },
    http: {
      port: 8000,
      mediaroot: "./media",
      allow_origin: "*",
    },
  };

  private constructor() {
    this.nms = new NodeMediaServer(this.config);
    this.addListeners();
  }

  public static getInstance(): SingletonNMS {
    if (!SingletonNMS.instance) {
      SingletonNMS.instance = new SingletonNMS();
    }
    return SingletonNMS.instance;
  }

  public run(): void {
    this.nms.run();
  }

  private addListeners(): void {
    this.nms.on("prePublish", (id: any, StreamPath: any, args: any) => {
      console.log(
        `[NodeEvent on prePublish] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(
          args
        )}`
      );
    });

    this.nms.on("postPublish", (id: any, StreamPath: any, args: any) => {
      console.log(
        `[NodeEvent on postPublish] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(
          args
        )}`
      );
    });

    this.nms.on("donePublish", (id: any, StreamPath: any, args: any) => {
      console.log(
        `[NodeEvent on donePublish] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(
          args
        )}`
      );
    });

    this.nms.on("prePlay", (id: any, StreamPath: any, args: any) => {
      console.log(
        `[NodeEvent on prePlay] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(
          args
        )}`
      );
    });

    this.nms.on("postPlay", (id: any, StreamPath: any, args: any) => {
      console.log(
        `[NodeEvent on postPlay] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(
          args
        )}`
      );
    });

    this.nms.on("donePlay", (id: any, StreamPath: any, args: any) => {
      console.log(
        `[NodeEvent on donePlay] id=${id} StreamPath=${StreamPath} args=${JSON.stringify(
          args
        )}`
      );
    });
  }
}

export default SingletonNMS;
